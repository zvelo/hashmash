"use strict"

HashMash = undefined

execute = ->
  NUM_BITS    = 20
  RESOURCE    = "zvelo.com"
  WORKER_FILE = "/base/amd/hashmash_worker.js"

  describe "web workers", ->
    it "should generate the hashmash using web workers", (done) ->
      @timeout(60000)

      cb = (result) ->
        hc.validate(result).should.equal true
        parts = HashMash.parse result
        parts.resource.should.equal(RESOURCE)
        done()

      hc = new HashMash NUM_BITS, cb, this, WORKER_FILE
      hc.generate RESOURCE
