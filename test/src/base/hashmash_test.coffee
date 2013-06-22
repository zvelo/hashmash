"use strict"

expect = undefined
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
        expect(date.length).to.equal 6

        genYear  = parseInt date.substr(0, 2), 10
        genMonth = parseInt date.substr(2, 2), 10
        genDay   = parseInt date.substr(4, 2), 10

        expect(genYear).to.be.within 0, 100
        expect(genMonth).to.be.within 1, 12
        expect(genDay).to.be.within 1, 31

        expect(genYear).to.equal year
        expect(genMonth).to.equal month
        expect(genDay).to.equal day

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
          expect(HashMash.parse()).not.to.exist
          expect(HashMash.parse("")).not.to.exist
          expect(HashMash.parse("#{parts.version}")).not.to.exist
          expect(HashMash.parse("#{parts.version}:")).not.to.exist
          expect(HashMash.parse("#{parts.version}:#{parts.bits}")).not.to.exist
          expect(HashMash.parse("#{parts.version}:#{parts.bits}:")).not.to.exist

          expect(HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                "#{parts.date}")).not.to.exist

          expect(HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                "#{parts.date}:")).not.to.exist

          expect(HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                "#{parts.date}:#{parts.resource}")).not.to.exist

          expect(HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                "#{parts.date}:#{parts.resource}:")
          ).not.to.exist

          expect(HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                "#{parts.date}:#{parts.resource}::")
          ).not.to.exist

          expect(HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                "#{parts.date}:#{parts.resource}:" +
                                "#{parts.rand}")).not.to.exist

          expect(HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                "#{parts.date}:#{parts.resource}:" +
                                "#{parts.rand}:")).not.to.exist

          expect(HashMash.parse("#{parts.version}:#{parts.bits}:" +
                                "#{parts.date}:#{parts.resource}:" +
                                "#{parts.rand}:r")).not.to.exist

      describe "success", ->
        it "should parse", ->
          str = HashMash.unparse parts

          data = HashMash.parse str
          expect(data).to.exist.and.deep.equal parts

          data = HashMash.parse "#{str}:"
          expect(data).to.exist.and.deep.equal parts

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

          hm = new HashMash parts.bits

          expect(hm.validate()).not.to.exist
          expect(hm.validate "").not.to.exist
          expect(hm.validate "", 0).not.to.exist

          challenge = HashMash.unparse parts
          expect(hm.validate challenge).to.not.exist

          hm.generate(parts.resource)
            .then((challenge) ->
              expect(challenge[0]).to.equal "#{HashMash.VERSION}"
              expect(HashMash.VERSION).to.be.within 0, 8
              challenge = "#{HashMash.VERSION + 1}#{challenge.substr 1}"
              expect(hm.validate challenge).to.not.exist
              done())
            .otherwise(done)

      describe "success", ->
        it "should validate", (done) ->
          @timeout(30000)

          hm = new HashMash parts.bits
          hm.generate(parts.resource)
            .then((challenge) ->
              parsed = HashMash.parse challenge
              expect(hm.validate challenge).to.exist.and.deep.equal parsed
              done())
            .otherwise(done)
