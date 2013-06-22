"use strict"

expect   = undefined
HashMash = undefined

execute = ->
  NUM_BITS    = 20
  RESOURCE    = "zvelo.com"
  WORKER_FILE = "/base/worker.min.js"

  describe "web workers", ->
    it "should generate the hashmash using web workers", (done) ->
      @timeout(60000)

      hc = new HashMash NUM_BITS, WORKER_FILE
      hc.generate(RESOURCE)
        .then((result) ->
          parsed = HashMash.parse result
          expect(hc.validate result).to.exist.and.deep.equal parsed
          parts = HashMash.parse result
          expect(parts.resource).to.equal RESOURCE
          done())
        .otherwise(done)
