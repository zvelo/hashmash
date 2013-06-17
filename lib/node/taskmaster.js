(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["os", "path", "module", "child_process", "../taskmaster"], function(os, path, module, childProcess, taskmaster) {
    var NodeTaskMaster, TaskMaster, workerFile, __dirname;
    TaskMaster = taskmaster.TaskMaster;
    __dirname = path.dirname(module.uri);
    workerFile = path.join(__dirname, "worker.js");
    NodeTaskMaster = (function(_super) {
      __extends(NodeTaskMaster, _super);

      NodeTaskMaster.MAX_NUM_WORKERS = os.cpus != null ? os.cpus().length : 4;

      NodeTaskMaster.DEFAULT_NUM_WORKERS = NodeTaskMaster.MAX_NUM_WORKERS;

      function NodeTaskMaster(range) {
        NodeTaskMaster.__super__.constructor.call(this, range);
      }

      NodeTaskMaster.prototype.connect = function() {
        var me;
        this.worker = childProcess.fork(workerFile);
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
    return NodeTaskMaster;
  });

}).call(this);

/*
//@ sourceMappingURL=taskmaster.js.map
*/