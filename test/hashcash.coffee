should = require "should"
HashCash = require("..").HashCash

describe "hashcash", ->
  describe "genDate", ->
    it "should match today", ->
      now = new Date()

      year  = now.getYear() - 100
      month = now.getMonth() + 1
      day   = now.getDate()

      genDate = HashCash.genDate()
      genDate.length.should.equal 6

      genYear  = parseInt genDate.substr(0, 2), 10
      genMonth = parseInt genDate.substr(2, 2), 10
      genDay   = parseInt genDate.substr(4, 2), 10

      genYear.should.be.within 0, 100
      genMonth.should.be.within 1, 12
      genDay.should.be.within 1, 31

      genYear.should.equal year
      genMonth.should.equal month
      genDay.should.equal day

  describe "parse", ->
    parts =
      version: HashCash.VERSION = 1
      bits: 20
      date: parseInt HashCash.genDate(), 10
      rand: Math.random().toString(36).substr 2
      resource: "abcd"
      counter: 1

    describe "failure", ->
      it "should not parse", ->
        should.not.exist HashCash.parse()
        should.not.exist HashCash.parse("")
        should.not.exist HashCash.parse("#{parts.version}")
        should.not.exist HashCash.parse("#{parts.version}:")
        should.not.exist HashCash.parse("#{parts.version}:#{parts.bits}")
        should.not.exist HashCash.parse("#{parts.version}:#{parts.bits}:")

        should.not.exist HashCash.parse("#{parts.version}:#{parts.bits}:" +
                                        "#{parts.date}")

        should.not.exist HashCash.parse("#{parts.version}:#{parts.bits}:" +
                                        "#{parts.date}:")

        should.not.exist HashCash.parse("#{parts.version}:#{parts.bits}:" +
                                        "#{parts.date}:#{parts.resource}")

        should.not.exist HashCash.parse("#{parts.version}:#{parts.bits}:" +
                                        "#{parts.date}:#{parts.resource}:")

        should.not.exist HashCash.parse("#{parts.version}:#{parts.bits}:" +
                                        "#{parts.date}:#{parts.resource}::")

        should.not.exist HashCash.parse("#{parts.version}:#{parts.bits}:" +
                                        "#{parts.date}:#{parts.resource}:" +
                                        "#{parts.rand}")

        should.not.exist HashCash.parse("#{parts.version}:#{parts.bits}:" +
                                        "#{parts.date}:#{parts.resource}:" +
                                        "#{parts.rand}:")

        should.not.exist HashCash.parse("#{parts.version}:#{parts.bits}:" +
                                        "#{parts.date}:#{parts.resource}:" +
                                        "#{parts.rand}:r")

    describe "success", ->
      it "should parse", ->
        str = HashCash.buildString parts

        data = HashCash.parse str
        should.exist data
        data.should.eql parts

        data = HashCash.parse "#{str}:"
        should.exist data
        data.should.eql parts

  describe "validate", ->
    parts =
      version: HashCash.VERSION
      bits: 16
      date: HashCash.genDate()
      rand: Math.random().toString(36).substr 2
      resource: "abcd"

    describe "failure", ->
      it "should not validate", (done) ->
        hc = new HashCash this, parts.bits, (challenge) ->
          challenge[0].should.equal "#{HashCash.VERSION}"
          HashCash.VERSION.should.be.within 0, 8
          challenge = "#{HashCash.VERSION + 1}#{challenge.substr 1}"
          hc.validate(challenge).should.equal false
          done()

        hc.validate()
          .should.equal false

        hc.validate("")
          .should.equal false

        hc.validate("", 0)
          .should.equal false

        challenge = HashCash.buildString parts
        hc.validate(challenge).should.equal false

        hc.generate parts.resource

    describe "success", ->
      it "should validate", (done) ->
        hc = new HashCash this, parts.bits, (challenge) ->
          hc.validate(challenge).should.equal true
          done()
        hc.generate parts.resource
