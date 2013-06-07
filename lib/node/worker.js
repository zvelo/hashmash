(function() {
  "use strict";
  var Drone, drone, path, requirejs;

  path = require("path");

  requirejs = require("requirejs");

  requirejs.config({
    baseUrl: path.join(__dirname, ".."),
    nodeRequire: require
  });

  Drone = requirejs("./drone");

  drone = new Drone(function(data) {
    return process.send(data);
  });

  process.on("message", function(data) {
    return drone.gotMessage(data);
  });

}).call(this);

/*
//@ sourceMappingURL=worker.js.map
*/