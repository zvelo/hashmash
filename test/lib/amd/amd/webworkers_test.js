(function() {
  "use strict";
  var HashMash, execute;

  HashMash = void 0;

  execute = function() {
    var NUM_BITS, RESOURCE, WORKER_FILE;
    NUM_BITS = 20;
    RESOURCE = "zvelo.com";
    WORKER_FILE = "/base/amd/hashmash_worker.js";
    return describe("web workers", function() {
      return it("should generate the hashmash using web workers", function(done) {
        var hc;
        this.timeout(60000);
        hc = new HashMash(NUM_BITS, WORKER_FILE);
        return hc.generate(RESOURCE).then(function(result) {
          var parts;
          hc.validate(result).should.equal(true);
          parts = HashMash.parse(result);
          parts.resource.should.equal(RESOURCE);
          return done();
        }).otherwise(function() {
          return done("HashMash generation failed");
        });
      });
    });
  };

  define(["HashMash"], function(hashmash) {
    HashMash = hashmash;
    return execute();
  });

}).call(this);

/*
//@ sourceMappingURL=webworkers_test.js.map
*/