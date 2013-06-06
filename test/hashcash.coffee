should = require "should"
HashCash = require ".."

describe "hashcash", ->
  describe "date", ->
    it "should match today", ->
      now = new Date()

      year  = now.getYear() - 100
      month = now.getMonth() + 1
      day   = now.getDate()

      date = HashCash.date()
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
      version: HashCash.VERSION = 1
      bits: 20
      date: parseInt HashCash.date(), 10
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
        str = HashCash.unparse parts

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
      date: HashCash.date()
      rand: Math.random().toString(36).substr 2
      resource: "abcd"

    describe "failure", ->
      it "should not validate", (done) ->
        cb = (challenge) ->
          challenge[0].should.equal "#{HashCash.VERSION}"
          HashCash.VERSION.should.be.within 0, 8
          challenge = "#{HashCash.VERSION + 1}#{challenge.substr 1}"
          hc.validate(challenge).should.equal false
          done()

        hc = new HashCash parts.bits, cb, this
        hc.validate()
          .should.equal false

        hc.validate("")
          .should.equal false

        hc.validate("", 0)
          .should.equal false

        challenge = HashCash.unparse parts
        hc.validate(challenge).should.equal false

        hc.generate parts.resource

    describe "success", ->
      it "should validate", (done) ->
        cb = (challenge) ->
          hc.validate(challenge).should.equal true
          done()

        hc = new HashCash parts.bits, cb, this
        hc.generate parts.resource
