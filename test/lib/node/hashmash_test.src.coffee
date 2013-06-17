"use strict"

should = undefined
HashMash = undefined

execute = ->
  describe "hashmash", ->
    describe "date", ->
      it "should match today", ->
        now = new Date()

        year  = now.getYear() - 100
        month = now.getMonth() + 1
        day   = now.getDate()

        date = HashMash.date()
        date.length.should.equal 6

        genYear  = parseInt date.substr(0, 2), 10
        genMonth = parseInt date.substr(2, 2), 10
        genDay   = parseInt date.substr(4, 2), 10

        genYear.should.be.within 0, 100
        genMonth.should.be.within 1, 12
        genDay.should.be.within 1, 31

        genYear.should.equal year
        genMonth.should.equal month
        genDay.should.equal day

    describe "parse", ->
      parts =
        version: HashMash.VERSION = 1
        bits: 20
        date: parseInt HashMash.date(), 10
        rand: Math.random().toString(36).substr 2
        resource: "abcd"
        counter: 1

      describe "failure", ->
        it "should not parse", ->
          should.not.exist HashMash.parse()
          should.not.exist HashMash.parse("")
          should.not.exist HashMash.parse("#{parts.version}")
          should.not.exist HashMash.parse("#{parts.version}:")
          should.not.exist HashMash.parse("#{parts.version}:#{parts.bits}")
          should.not.exist HashMash.parse("#{parts.version}:#{parts.bits}:")

          should.not.exist HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                          "#{parts.date}")

          should.not.exist HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                          "#{parts.date}:")

          should.not.exist HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                          "#{parts.date}:#{parts.resource}")

          should.not.exist HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                          "#{parts.date}:#{parts.resource}:")

          should.not.exist HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                          "#{parts.date}:#{parts.resource}::")

          should.not.exist HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                          "#{parts.date}:#{parts.resource}:" +
                                          "#{parts.rand}")

          should.not.exist HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                          "#{parts.date}:#{parts.resource}:" +
                                          "#{parts.rand}:")

          should.not.exist HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                          "#{parts.date}:#{parts.resource}:" +
                                          "#{parts.rand}:r")

      describe "success", ->
        it "should parse", ->
          str = HashMash.unparse parts

          data = HashMash.parse str
          should.exist data
          data.should.eql parts

          data = HashMash.parse "#{str}:"
          should.exist data
          data.should.eql parts

    describe "validate", ->
      parts =
        version: HashMash.VERSION
        bits: 16
        date: HashMash.date()
        rand: Math.random().toString(36).substr 2
        resource: "abcd"

      describe "failure", ->
        it "should not validate", (done) ->
          @timeout(105000)

          hc = new HashMash parts.bits

          hc.validate()
            .should.equal false

          hc.validate("")
            .should.equal false

          hc.validate("", 0)
            .should.equal false

          challenge = HashMash.unparse parts
          hc.validate(challenge).should.equal false

          hc.generate(parts.resource)
            .then((challenge) ->
              challenge[0].should.equal "#{HashMash.VERSION}"
              HashMash.VERSION.should.be.within 0, 8
              challenge = "#{HashMash.VERSION + 1}#{challenge.substr 1}"
              hc.validate(challenge).should.equal false
              done())
            .otherwise(-> done("HashMash generation failed"))

      describe "success", ->
        it "should validate", (done) ->
          @timeout(30000)

          hc = new HashMash parts.bits
          hc.generate(parts.resource)
            .then((challenge) ->
              hc.validate(challenge).should.equal true
              done())
            .otherwise(-> done("HashMash generation failed"))

should   = require("chai").should()
HashMash = require "../../.."
execute()
