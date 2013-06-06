(function() {
  "use strict";
  var NodeTaskMaster, TIMEOUT_MAX_RUNTIME, TIMEOUT_YIELD_TIME, TaskMaster, TimeoutTaskMaster, WebTaskMaster, childProcess, properties, sha1, type, _i, _len, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  childProcess = require("child_process");

  sha1 = require("./sha1");

  properties = require("./properties");

  TIMEOUT_MAX_RUNTIME = 99;

  TIMEOUT_YIELD_TIME = 1;

  TaskMaster = (function() {
    TaskMaster.RANGE_INCREMENT = Math.pow(2, 15);

    function TaskMaster(_caller, _cb, _range) {
      this._caller = _caller;
      this._cb = _cb;
      this._range = _range;
    }

    TaskMaster.prototype._send = function(data) {
      this._spawn();
      if (this.sendFn == null) {
        return;
      }
      return this.sendFn(data);
    };

    TaskMaster.prototype._spawn = function() {
      if (this.worker != null) {
        return;
      }
      return this.connect();
    };

    TaskMaster.prototype._incRange = function() {
      this._range.begin = this._range.end + 1;
      return this._range.end = this._range.begin + TaskMaster.RANGE_INCREMENT - 1;
    };

    TaskMaster.prototype._sendRange = function() {
      this._incRange();
      return this._send({
        m: "range",
        range: this._range
      });
    };

    TaskMaster.prototype._gotResult = function(result) {
      if (result == null) {
        return;
      }
      return this._cb.call(this._caller, result);
    };

    TaskMaster.prototype._gotMessage = function(msg) {
      if ((msg != null ? msg.m : void 0) == null) {
        return;
      }
      switch (msg.m) {
        case "request_range":
          return this._sendRange();
        case "result":
          return this._gotResult(msg.result);
        case "console_log":
          return console.log("worker", msg.data);
      }
    };

    TaskMaster.prototype.sendData = function(data) {
      return this._send({
        m: "data",
        data: data
      });
    };

    TaskMaster.prototype.stop = function() {
      if (this.worker == null) {
        return;
      }
      this.disconnect();
      delete this.worker;
      return delete this.sendFn;
    };

    return TaskMaster;

  })();

  NodeTaskMaster = (function(_super) {
    __extends(NodeTaskMaster, _super);

    NodeTaskMaster.MAX_NUM_WORKERS = 8;

    NodeTaskMaster.DEFAULT_NUM_WORKERS = NodeTaskMaster.MAX_NUM_WORKERS;

    function NodeTaskMaster(caller, cb, range) {
      NodeTaskMaster.__super__.constructor.call(this, caller, cb, range);
      properties.makeReadOnly(this);
    }

    NodeTaskMaster.prototype.connect = function() {
      var me;
      this.worker = childProcess.fork(__dirname + "/worker.js");
      me = this;
      this.worker.on("message", function(data) {
        return me._gotMessage(data);
      });
      properties.makeReadOnly(this.worker);
      return this.sendFn = function(data) {
        return this.worker.send(data);
      };
    };

    NodeTaskMaster.prototype.disconnect = function() {
      return this.worker.disconnect();
    };

    return NodeTaskMaster;

  })(TaskMaster);

  WebTaskMaster = (function(_super) {
    __extends(WebTaskMaster, _super);

    WebTaskMaster.MAX_NUM_WORKERS = 8;

    WebTaskMaster.DEFAULT_NUM_WORKERS = 4;

    function WebTaskMaster(caller, cb, range, file) {
      this.file = file;
      WebTaskMaster.__super__.constructor.call(this, caller, cb, range);
      properties.makeReadOnly(this);
    }

    WebTaskMaster.prototype.connect = function() {
      var me;
      this.worker = new Worker(this.file);
      me = this;
      this.worker.onmessage = function(event) {
        return me._gotMessage(event.data);
      };
      properties.makeReadOnly(this.worker);
      return this.sendFn = function(data) {
        return this.worker.postMessage(data);
      };
    };

    WebTaskMaster.prototype.disconnect = function() {
      return this.worker.terminate();
    };

    return WebTaskMaster;

  })(TaskMaster);

  TimeoutTaskMaster = (function() {
    TimeoutTaskMaster.MAX_NUM_WORKERS = 1;

    TimeoutTaskMaster.DEFAULT_NUM_WORKERS = 1;

    function TimeoutTaskMaster(_caller, _cb) {
      this._caller = _caller;
      this._cb = _cb;
      properties.makeReadOnly(this);
    }

    TimeoutTaskMaster.prototype.sendData = function(_data) {
      this._data = _data;
      delete this._stopFlag;
      return this.start();
    };

    TimeoutTaskMaster.prototype.start = function() {
      var me, startTime;
      startTime = new Date();
      while (!((this._stopFlag != null) || (this._data.result != null) || (new Date() - startTime >= TIMEOUT_MAX_RUNTIME))) {
        sha1.tryChallenge(this._data);
      }
      if (this._stopFlag != null) {

      } else if (this._data.result != null) {
        return this._cb.call(this._caller, this._data.result);
      } else {
        me = this;
        return setTimeout((function() {
          return me.start();
        }), TIMEOUT_YIELD_TIME);
      }
    };

    TimeoutTaskMaster.prototype.stop = function() {
      return this._stopFlag = true;
    };

    return TimeoutTaskMaster;

  })();

  _ref = [TaskMaster, TaskMaster.prototype, NodeTaskMaster, NodeTaskMaster.prototype, WebTaskMaster, WebTaskMaster.prototype, TimeoutTaskMaster, TimeoutTaskMaster.prototype];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    type = _ref[_i];
    properties.makeReadOnly(type);
  }

  exports.NodeTaskMaster = NodeTaskMaster;

  exports.WebTaskMaster = WebTaskMaster;

  exports.TimeoutTaskMaster = TimeoutTaskMaster;

}).call(this);

/*
//@ sourceMappingURL=taskmaster.js.map
*/