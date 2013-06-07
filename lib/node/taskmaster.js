(function() {
  "use strict";
  var NodeTaskMaster, TaskMaster, childProcess, os, path, requirejs,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  os = require("os");

  path = require("path");

  childProcess = require("child_process");

  requirejs = require("requirejs");

  requirejs.config({
    baseUrl: path.join(__dirname, ".."),
    nodeRequire: require
  });

  TaskMaster = requirejs("./taskmaster").TaskMaster;

  NodeTaskMaster = (function(_super) {
    __extends(NodeTaskMaster, _super);

    NodeTaskMaster.MAX_NUM_WORKERS = os.cpus != null ? os.cpus().length : 4;

    NodeTaskMaster.DEFAULT_NUM_WORKERS = NodeTaskMaster.MAX_NUM_WORKERS;

    function NodeTaskMaster(caller, cb, range) {
      NodeTaskMaster.__super__.constructor.call(this, caller, cb, range);
    }

    NodeTaskMaster.prototype.connect = function() {
      var me;
      this.worker = childProcess.fork(path.join(__dirname, "worker.js"));
      me = this;
      this.worker.on("message", function(data) {
        return me._gotMessage(data);
      });
      return this.sendFn = function(data) {
        return this.worker.send(data);
      };
    };

    NodeTaskMaster.prototype.disconnect = function() {
      return this.worker.disconnect();
    };

    return NodeTaskMaster;

  })(TaskMaster);

  module.exports = NodeTaskMaster;

}).call(this);

/*
//@ sourceMappingURL=taskmaster.js.map
*/