(function() {
  "use strict";
  var HashCash, execute;

  HashCash = void 0;

  execute = function() {
    var NUM_BITS, RESOURCE, WORKER_FILE;
    NUM_BITS = 20;
    RESOURCE = "zvelo.com";
    WORKER_FILE = "/base/browser/hashcash_worker.js";
    return describe("web workers", function() {
      return it("should generate the hashcash using web workers", function(done) {
        var cb, hc;
        this.timeout(60000);
        cb = function(result) {
          var parts;
          hc.validate(result).should.equal(true);
          parts = HashCash.parse(result);
          parts.resource.should.equal(RESOURCE);
          return done();
        };
        hc = new HashCash(NUM_BITS, cb, this, WORKER_FILE);
        return hc.generate(RESOURCE);
      });
    });
  };

  HashCash = require("../../..");

  execute();

}).call(this);

/*
//@ sourceMappingURL=webworkers_test.js.map
*/