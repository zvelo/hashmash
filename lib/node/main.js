(function() {
  "use strict";
  var HashCash, path, requirejs;

  path = require("path");

  requirejs = require("requirejs");

  requirejs.config({
    baseUrl: path.join(__dirname, ".."),
    nodeRequire: require
  });

  HashCash = requirejs("./hashcash");

  HashCash.TaskMaster = requirejs("./node/taskmaster");

  module.exports = HashCash;

}).call(this);

/*
//@ sourceMappingURL=main.js.map
*/