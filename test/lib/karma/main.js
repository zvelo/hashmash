(function() {
  "use strict";
  var relRootDir, tests;

  tests = Object.keys(window.__karma__.files).filter(function(file) {
    return /^\/base\/test\/lib\/amd\/.*\.js$/.test(file);
  });

  relRootDir = "../../..";

  requirejs.config({
    baseUrl: "/base/test/lib/amd",
    enforceDefine: true,
    paths: {
      chai: "" + relRootDir + "/node_modules/chai/chai",
      hashmash: "" + relRootDir + "/hashmash"
    },
    packages: [
      {
        name: "when",
        location: "" + relRootDir + "/node_modules/when",
        main: "when"
      }, {
        name: "poly",
        location: "" + relRootDir + "/lib/poly",
        main: "poly"
      }
    ],
    deps: ["chai", "poly/function"],
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