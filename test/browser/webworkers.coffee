should = require("chai").should()
HashCash = require ".."

NUM_BITS    = 20
RESOURCE    = "zvelo.com"
WORKER_FILE = "/base/browser/hashcash_worker.js"

describe "web workers", ->
  it "should generate the hashcash using web workers", (done) ->
    @timeout(20000)

    cb = (result) ->
      hc.validate(result).should.equal true
      parts = HashCash.parse result
      parts.resource.should.equal(RESOURCE)
      done()

    hc = new HashCash NUM_BITS, cb, this, WORKER_FILE
    hc.generate RESOURCE
