(function() {
  "use strict";
  var relRootDir, tests;

  tests = Object.keys(window.__karma__.files).filter(function(file) {
    return /^\/base\/test\/lib\/requirejs\/.*\.js$/.test(file);
  });

  relRootDir = "../../..";

  requirejs.config({
    baseUrl: "/base/test/lib/requirejs",
    enforceDefine: true,
    paths: {
      chai: "" + relRootDir + "/node_modules/chai/chai",
      HashMash: "" + relRootDir + "/browser/hashmash"
    },
    deps: ["chai"],
    callback: function(chai) {
      chai.should();
      return requirejs(tests, function() {
        return window.__karma__.start();
      });
    }
  });

}).call(this);

/*
//@ sourceMappingURL=main.js.map
*/