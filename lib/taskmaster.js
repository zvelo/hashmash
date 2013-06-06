(function() {
  var NodeTaskMaster, TIMEOUT_MAX_RUNTIME, TIMEOUT_YIELD_TIME, TaskMaster, TimeoutTaskMaster, WebTaskMaster, childProcess, os, properties, sha1, type, _gotMessage, _gotResult, _i, _incRange, _j, _k, _l, _len, _len1, _len2, _len3, _nodeConnect, _nodeDisconnect, _ref, _ref1, _ref2, _ref3, _send, _sendRange, _spawn, _timeoutSendData, _timeoutStart, _timeoutStop, _webConnect, _webDisconnect, _workerSendData, _workerStop,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  os = require("os");

  childProcess = require("child_process");

  sha1 = require("./sha1");

  properties = require("./properties");

  TIMEOUT_MAX_RUNTIME = 99;

  TIMEOUT_YIELD_TIME = 1;

  _send = function(data) {
    this._spawn();
    if (this.sendFn == null) {
      return;
    }
    return this.sendFn(data);
  };

  _spawn = function() {
    if (this.worker != null) {
      return;
    }
    return this.connect();
  };

  _incRange = function() {
    this._range.begin = this._range.end + 1;
    return this._range.end = this._range.begin + TaskMaster.RANGE_INCREMENT - 1;
  };

  _sendRange = function() {
    this._incRange();
    return this._send({
      m: "range",
      range: this._range
    });
  };

  _gotResult = function(result) {
    if (result == null) {
      return;
    }
    return this._callback.call(this._caller, result);
  };

  _gotMessage = function(msg) {
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

  _workerSendData = function(data) {
    return this._send({
      m: "data",
      data: data
    });
  };

  _workerStop = function() {
    if (this.worker == null) {
      return;
    }
    this.disconnect();
    delete this.worker;
    return delete this.sendFn;
  };

  _nodeConnect = function() {
    var me;
    this.worker = childProcess.fork(__dirname + "/worker.js");
    me = this;
    this.worker.on("message", function(data) {
      return me._gotMessage.call(me, data);
    });
    properties.makeReadOnly(this.worker);
    return this.sendFn = function(data) {
      return this.worker.send(data);
    };
  };

  _nodeDisconnect = function() {
    return this.worker.disconnect();
  };

  _webConnect = function() {
    var me;
    this.worker = new Worker(this.file);
    me = this;
    this.worker.onmessage = function(event) {
      return me._gotMessage.call(me, event.data);
    };
    properties.makeReadOnly(this.worker);
    return this.sendFn = function(data) {
      return this.worker.postMessage(data);
    };
  };

  _webDisconnect = function() {
    return this.worker.terminate();
  };

  _timeoutSendData = function(_data) {
    this._data = _data;
    delete this._stopFlag;
    return _timeoutStart.apply(this);
  };

  _timeoutStart = function() {
    var me, startTime;
    startTime = new Date();
    while (!((this._stopFlag != null) || (this._data.result != null) || (new Date() - startTime >= TIMEOUT_MAX_RUNTIME))) {
      sha1.tryChallenge(this._data);
    }
    if (this._stopFlag != null) {

    } else if (this._data.result != null) {
      return this._callback.call(this._caller, this._data.result);
    } else {
      me = this;
      return setTimeout((function() {
        return _timeoutStart.apply(me);
      }), TIMEOUT_YIELD_TIME);
    }
  };

  _timeoutStop = function() {
    return this._stopFlag = true;
  };

  TaskMaster = (function() {
    TaskMaster.RANGE_INCREMENT = Math.pow(2, 15);

    function TaskMaster(_caller, _callback, _range) {
      this._caller = _caller;
      this._callback = _callback;
      this._range = _range;
      properties.makeReadOnly(this);
    }

    TaskMaster.prototype._send = function() {
      return _send.apply(this, arguments);
    };

    TaskMaster.prototype._spawn = function() {
      return _spawn.apply(this, arguments);
    };

    TaskMaster.prototype._incRange = function() {
      return _incRange.apply(this, arguments);
    };

    TaskMaster.prototype._sendRange = function() {
      return _sendRange.apply(this, arguments);
    };

    TaskMaster.prototype._gotResult = function() {
      return _gotResult.apply(this, arguments);
    };

    TaskMaster.prototype._gotMessage = function() {
      return _gotMessage.apply(this, arguments);
    };

    TaskMaster.prototype.sendData = function() {
      return _workerSendData.apply(this, arguments);
    };

    TaskMaster.prototype.stop = function() {
      return _workerStop.apply(this, arguments);
    };

    return TaskMaster;

  })();

  _ref = [TaskMaster, TaskMaster.prototype];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    type = _ref[_i];
    properties.makeReadOnly(type);
  }

  NodeTaskMaster = (function(_super) {
    __extends(NodeTaskMaster, _super);

    NodeTaskMaster.MAX_NUM_WORKERS = os.cpus != null ? os.cpus().length : 4;

    NodeTaskMaster.DEFAULT_NUM_WORKERS = NodeTaskMaster.MAX_NUM_WORKERS;

    function NodeTaskMaster(caller, callback, range) {
      NodeTaskMaster.__super__.constructor.call(this, caller, callback, range);
      properties.makeReadOnly(this);
    }

    NodeTaskMaster.prototype.connect = function() {
      return _nodeConnect.apply(this, arguments);
    };

    NodeTaskMaster.prototype.disconnect = function() {
      return _nodeDisconnect.apply(this, arguments);
    };

    return NodeTaskMaster;

  })(TaskMaster);

  _ref1 = [NodeTaskMaster, NodeTaskMaster.prototype];
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    type = _ref1[_j];
    properties.makeReadOnly(type);
  }

  WebTaskMaster = (function(_super) {
    __extends(WebTaskMaster, _super);

    WebTaskMaster.MAX_NUM_WORKERS = 8;

    WebTaskMaster.DEFAULT_NUM_WORKERS = 4;

    function WebTaskMaster(caller, callback, range, file) {
      this.file = file;
      WebTaskMaster.__super__.constructor.call(this, caller, callback, range);
      properties.makeReadOnly(this);
    }

    WebTaskMaster.prototype.connect = function() {
      return _webConnect.apply(this, arguments);
    };

    WebTaskMaster.prototype.disconnect = function() {
      return _webDisconnect.apply(this, arguments);
    };

    return WebTaskMaster;

  })(TaskMaster);

  _ref2 = [WebTaskMaster, WebTaskMaster.prototype];
  for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
    type = _ref2[_k];
    properties.makeReadOnly(type);
  }

  TimeoutTaskMaster = (function() {
    TimeoutTaskMaster.MAX_NUM_WORKERS = 1;

    TimeoutTaskMaster.DEFAULT_NUM_WORKERS = 1;

    function TimeoutTaskMaster(_caller, _callback) {
      this._caller = _caller;
      this._callback = _callback;
      properties.makeReadOnly(this);
    }

    TimeoutTaskMaster.prototype.sendData = function() {
      return _timeoutSendData.apply(this, arguments);
    };

    TimeoutTaskMaster.prototype.stop = function() {
      return _timeoutStop.apply(this, arguments);
    };

    return TimeoutTaskMaster;

  })();

  _ref3 = [TimeoutTaskMaster, TimeoutTaskMaster.prototype];
  for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
    type = _ref3[_l];
    properties.makeReadOnly(type);
  }

  exports.NodeTaskMaster = NodeTaskMaster;

  exports.WebTaskMaster = WebTaskMaster;

  exports.TimeoutTaskMaster = TimeoutTaskMaster;

}).call(this);
