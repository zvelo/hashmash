(function() {
  "use strict";
  var baseDir, findTests, fs, path, relRootDir, requirejs, rootDir, tests;

  fs = require("fs");

  path = require("path");

  requirejs = require("requirejs");

  relRootDir = "../../..";

  rootDir = path.join(__dirname, relRootDir);

  baseDir = path.join(rootDir, "test/lib/amd");

  findTests = function(base, dir) {
    var extension, file, name, stats, test, tests, _i, _len, _ref;
    tests = [];
    _ref = fs.readdirSync(path.join(base, dir));
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      if (name[0] === '.') {
        continue;
      }
      file = "" + dir + "/" + name;
      stats = fs.statSync(path.join(base, file));
      if (stats.isFile()) {
        extension = name.slice(name.lastIndexOf('.'));
        if (extension !== ".js") {
          continue;
        }
        test = file.slice(0, +(file.lastIndexOf('.') - 1) + 1 || 9e9);
        tests.unshift(test);
      }
    }
    return tests;
  };

  tests = findTests(baseDir, ".");

  requirejs.config({
    baseUrl: baseDir,
    enforceDefine: true,
    paths: {
      chai: "" + relRootDir + "/node_modules/chai/chai",
      HashMash: "" + relRootDir + "/amd/hashmash"
    }
  });

  describe("TestRunner", function() {
    return it("should run all tests", function(done) {
      return requirejs(["chai"], function(chai) {
        chai.should();
        return requirejs(tests, function() {
          return done();
        });
      });
    });
  });

}).call(this);

/*
//@ sourceMappingURL=main.js.map
*/