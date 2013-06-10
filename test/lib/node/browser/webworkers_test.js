(function() {
  "use strict";
  var HashMash, execute;

  HashMash = void 0;

  execute = function() {
    var NUM_BITS, RESOURCE, WORKER_FILE;
    NUM_BITS = 20;
    RESOURCE = "zvelo.com";
    WORKER_FILE = "/base/browser/hashmash_worker.js";
    return describe("web workers", function() {
      return it("should generate the hashmash using web workers", function(done) {
        var cb, hc;
        this.timeout(60000);
        cb = function(result) {
          var parts;
          hc.validate(result).should.equal(true);
          parts = HashMash.parse(result);
          parts.resource.should.equal(RESOURCE);
          return done();
        };
        hc = new HashMash(NUM_BITS, cb, this, WORKER_FILE);
        return hc.generate(RESOURCE);
      });
    });
  };

  HashMash = require("../../..");

  execute();

}).call(this);

/*
//@ sourceMappingURL=webworkers_test.js.map
*/