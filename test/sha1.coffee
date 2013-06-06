sha1 = require ".."

describe "sha1", ->
  describe "short", ->
    it "should match the known value", ->
      sha1
        .hash("abc")
        .should.equal("a9993e364706816aba3e25717850c26c9cd0d89d")

  describe "medium", ->
    it "should match the known value", ->
      sha1
        .hash("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")
        .should.equal("84983e441c3bd26ebaae4aa1f95129e5e54670f1")

  describe "long", ->
    it "should match the known value", ->
      ONE_MILLION = 1000000

      str = ""
      str += 'a' for i in [ 1 .. ONE_MILLION ]
      str.length.should.equal(ONE_MILLION)

      sha1
        .hash(str)
        .should.equal("34aa973cd4c4daa4f61eeb2bdbad27316534016f")
