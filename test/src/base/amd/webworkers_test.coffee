"use strict"

HashMash = undefined

execute = ->
  NUM_BITS    = 20
  RESOURCE    = "zvelo.com"
  WORKER_FILE = "/base/amd/hashmash_worker.js"

  describe "web workers", ->
    it "should generate the hashmash using web workers", (done) ->
      @timeout(60000)

      hc = new HashMash NUM_BITS, WORKER_FILE
      hc.generate(RESOURCE)
        .then((result) ->
          hc.validate(result).should.equal true
          parts = HashMash.parse result
          parts.resource.should.equal(RESOURCE)
          done())
        .otherwise(-> done("HashMash generation failed"))
