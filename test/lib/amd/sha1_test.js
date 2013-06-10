(function() {
  "use strict";
  var execute, sha1;

  sha1 = void 0;

  execute = function() {
    return describe("sha1", function() {
      describe("short", function() {
        return it("should match the known value", function() {
          return sha1.hash("abc").should.equal("a9993e364706816aba3e25717850c26c9cd0d89d");
        });
      });
      describe("medium", function() {
        return it("should match the known value", function() {
          return sha1.hash("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq").should.equal("84983e441c3bd26ebaae4aa1f95129e5e54670f1");
        });
      });
      return describe("long", function() {
        return it("should match the known value", function() {
          var ONE_MILLION, i, str, _i;
          ONE_MILLION = 1000000;
          str = "";
          for (i = _i = 1; 1 <= ONE_MILLION ? _i <= ONE_MILLION : _i >= ONE_MILLION; i = 1 <= ONE_MILLION ? ++_i : --_i) {
            str += 'a';
          }
          str.length.should.equal(ONE_MILLION);
          return sha1.hash(str).should.equal("34aa973cd4c4daa4f61eeb2bdbad27316534016f");
        });
      });
    });
  };

  sha1 = void 0;

  define(["HashMash"], function(HashMash) {
    sha1 = HashMash;
    return execute();
  });

}).call(this);

/*
//@ sourceMappingURL=sha1_test.js.map
*/