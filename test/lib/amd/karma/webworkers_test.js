(function() {
  "use strict";
  var HashMash, execute, expect;

  expect = void 0;

  HashMash = void 0;

  execute = function() {
    var NUM_BITS, RESOURCE, WORKER_FILE;
    NUM_BITS = 20;
    RESOURCE = "zvelo.com";
    WORKER_FILE = "/base/worker.min.js";
    return describe("web workers", function() {
      return it("should generate the hashmash using web workers", function(done) {
        var hc;
        this.timeout(60000);
        hc = new HashMash(NUM_BITS, WORKER_FILE);
        return hc.generate(RESOURCE).then(function(result) {
          var parsed, parts;
          parsed = HashMash.parse(result);
          expect(hc.validate(result)).to.exist.and.deep.equal(parsed);
          parts = HashMash.parse(result);
          expect(parts.resource).to.equal(RESOURCE);
          return done();
        }).otherwise(done);
      });
    });
  };

  define(["chai", "hashmash"], function(chai, hashmash) {
    expect = chai.expect;
    HashMash = hashmash;
    return execute();
  });

}).call(this);

/*
//@ sourceMappingURL=webworkers_test.js.map
*/