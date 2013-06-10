(function() {
  "use strict";
  var HashMash, path, requirejs;

  path = require("path");

  requirejs = require("requirejs");

  requirejs.config({
    baseUrl: path.join(__dirname, ".."),
    nodeRequire: require
  });

  HashMash = requirejs("./hashmash");

  HashMash.TaskMaster = requirejs("./node/taskmaster");

  module.exports = HashMash;

}).call(this);

/*
//@ sourceMappingURL=main.js.map
*/