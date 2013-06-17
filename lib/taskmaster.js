(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["./sha1"], function(sha1) {
    var TIMEOUT_MAX_RUNTIME, TIMEOUT_YIELD_TIME, TaskMaster, TimeoutTaskMaster, WebTaskMaster, exports;
    TIMEOUT_MAX_RUNTIME = 99;
    TIMEOUT_YIELD_TIME = 1;
    exports = {};
    TaskMaster = (function() {
      TaskMaster.RANGE_INCREMENT = Math.pow(2, 15);

      function TaskMaster(_range) {
        this._range = _range;
        this._sendQueue = [];
        this._ready = false;
      }

      TaskMaster.prototype._send = function(data) {
        this._spawn();
        if (this.sendFn == null) {
          return;
        }
        if (this._ready) {
          return this.sendFn(data);
        }
        return this._sendQueue.push(data);
      };

      TaskMaster.prototype._setGo = function() {
        var _results;
        this._ready = true;
        _results = [];
        while (this._sendQueue.length) {
          _results.push(this._send(this._sendQueue.shift()));
        }
        return _results;
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
          throw new Error("TaskMaster expected a result");
        }
        if (this._resolver == null) {
          throw new Error("TaskMaster requires a resolver");
        }
        return this._resolver.resolve(result);
      };

      TaskMaster.prototype._gotMessage = function(msg) {
        if ((msg != null ? msg.m : void 0) == null) {
          return;
        }
        switch (msg.m) {
          case "ready":
            return this._setGo();
          case "request_range":
            return this._sendRange();
          case "result":
            return this._gotResult(msg.result);
        }
      };

      TaskMaster.prototype.sendData = function(_resolver, data) {
        this._resolver = _resolver;
        if (this._resolver == null) {
          throw new Error("TaskMaster requires a resolver");
        }
        return this._send({
          m: "data",
          data: data
        });
      };

      TaskMaster.prototype.stop = function() {
        this._ready = false;
        this._sendQueue.length = 0;
        if (this.worker == null) {
          return;
        }
        this.disconnect();
        delete this.worker;
        return delete this.sendFn;
      };

      return TaskMaster;

    })();
    exports.TaskMaster = TaskMaster;
    WebTaskMaster = (function(_super) {
      __extends(WebTaskMaster, _super);

      WebTaskMaster.MAX_NUM_WORKERS = 8;

      WebTaskMaster.DEFAULT_NUM_WORKERS = 4;

      function WebTaskMaster(range, file) {
        this.file = file;
        WebTaskMaster.__super__.constructor.call(this, range);
      }

      WebTaskMaster.prototype.connect = function() {
        var me;
        this.worker = new Worker(this.file);
        me = this;
        this.worker.onmessage = function(event) {
          return me._gotMessage(event.data);
        };
        this.worker.onerror = function(event) {
          throw event.data;
        };
        return this.sendFn = function(data) {
          return this.worker.postMessage(data);
        };
      };

      WebTaskMaster.prototype.disconnect = function() {
        return this.worker.terminate();
      };

      return WebTaskMaster;

    })(TaskMaster);
    exports.WebTaskMaster = WebTaskMaster;
    TimeoutTaskMaster = (function() {
      function TimeoutTaskMaster() {}

      TimeoutTaskMaster.MAX_NUM_WORKERS = 1;

      TimeoutTaskMaster.DEFAULT_NUM_WORKERS = 1;

      TimeoutTaskMaster.prototype.sendData = function(_resolver, _data) {
        this._resolver = _resolver;
        this._data = _data;
        if (this._resolver == null) {
          throw new Error("TaskMaster requires a resolver");
        }
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
          if (this._resolver == null) {
            throw new Error("TaskMaster requires a resolver");
          }
          return this._resolver.resolve(this._data.result);
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
    exports.TimeoutTaskMaster = TimeoutTaskMaster;
    return exports;
  });

}).call(this);

/*
//@ sourceMappingURL=taskmaster.js.map
*/