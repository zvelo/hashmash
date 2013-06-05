/*
 * zvelo HashCash Javascript Library
 *
 * Copyright 2013 zvelo, Inc. All Rights Reserved
 *
 * SHA-1 implementation in JavaScript
 * (c) Chris Veness 2002-2010
 * www.movable-type.co.uk
 *  - http://csrc.nist.gov/groups/ST/toolkit/secure_hashing.html
 *  - http://csrc.nist.gov/groups/ST/toolkit/examples.html
 */

;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(require,module,exports){
(function(process){(function() {
  var Drone, HashCash, drone;

  HashCash = require("./hashcash").HashCash;

  if (typeof self !== "undefined" && self !== null) {
    self.console = {
      log: function() {
        var args;
        if (typeof drone === "undefined" || drone === null) {
          return;
        }
        args = Array.prototype.slice.call(arguments);
        return drone.sendFn({
          m: "console_log",
          data: args
        });
      }
    };
  }

  Drone = (function() {
    Drone.MAX_RUNTIME = 99;

    Drone.YIELD_TIME = 1;

    function Drone(sendFn) {
      this.sendFn = sendFn;
    }

    Drone.prototype.gotMessage = function(msg) {
      if (msg.m == null) {
        return;
      }
      switch (msg.m) {
        case "data":
          return this._gotData(msg.data);
        case "range":
          return this._gotRange(msg.range);
      }
    };

    Drone.prototype._gotData = function(value) {
      if (value == null) {
        return;
      }
      this._data = value;
      return this._requestRange();
    };

    Drone.prototype._gotRange = function(value) {
      if (value == null) {
        return;
      }
      this._range = value;
      this._data.counter = this._range.begin;
      return this.start();
    };

    Drone.prototype._requestRange = function() {
      return this.sendFn({
        m: "request_range"
      });
    };

    Drone.prototype._sendResult = function() {
      if (this._data.result == null) {
        return;
      }
      return this.sendFn({
        m: "result",
        result: this._data.result
      });
    };

    Drone.prototype.start = function() {
      if (!((this._data != null) && (this._range != null))) {
        return;
      }
      while (!((this._data.result != null) || this._data.counter === this._range.end)) {
        HashCash.testSha(this._data);
      }
      if (this._data.result != null) {
        return this._sendResult();
      } else {
        return this._requestRange();
      }
    };

    return Drone;

  })();

  if (typeof self !== "undefined" && self !== null) {
    drone = new Drone(function(data) {
      return self.postMessage(data);
    });
    self.onmessage = function(event) {
      return drone.gotMessage(event.data);
    };
  } else {
    drone = new Drone(function(data) {
      return process.send(data);
    });
    process.on("message", function(data) {
      return drone.gotMessage(data);
    });
  }

}).call(this);

})(require("__browserify_process"))
},{"./hashcash":3,"__browserify_process":1}],3:[function(require,module,exports){
(function() {
  var HashCash, NodeTaskMaster, TimeoutTaskMaster, WebTaskMaster, buildDate, nextPos, numLeading0s, sha1, taskmaster;

  sha1 = require("./sha1");

  taskmaster = require("./taskmaster");

  NodeTaskMaster = taskmaster.NodeTaskMaster;

  WebTaskMaster = taskmaster.WebTaskMaster;

  TimeoutTaskMaster = taskmaster.TimeoutTaskMaster;

  numLeading0s = function(hex_str) {
    var curNum, num, pos, _i, _ref;
    num = 0;
    for (pos = _i = 0, _ref = hex_str.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; pos = 0 <= _ref ? ++_i : --_i) {
      curNum = parseInt(hex_str[pos], 16);
      if (isNaN(curNum)) {
        break;
      }
      switch (curNum) {
        case 0x0:
          num += 4;
          break;
        case 0x1:
          return num + 3;
        case 0x2:
        case 0x3:
          return num + 2;
        case 0x4:
        case 0x5:
        case 0x6:
        case 0x7:
          return num + 1;
        default:
          return num;
      }
    }
    return num;
  };

  buildDate = function(date) {
    if (typeof date === "string") {
      if (date.length !== 6) {
        return null;
      }
      return date;
    }
    if (typeof date !== "number") {
      return null;
    }
    return buildDate("" + date);
  };

  nextPos = function(str, pos) {
    pos.start = pos.end + 1;
    if (pos.start === str.length) {
      return false;
    }
    pos.end = str.indexOf(':', pos.start);
    if (pos.end === -1) {
      return false;
    }
    if (pos.end === pos.start) {
      return false;
    }
    return true;
  };

  HashCash = (function() {
    HashCash.VERSION = 1;

    HashCash.MIN_BITS = 16;

    HashCash.hash = sha1.hash;

    HashCash.genDate = function() {
      var dd, mm, now, yy;
      now = new Date();
      yy = ("0" + (now.getYear() - 100)).slice(-2);
      mm = ('0' + (now.getMonth() + 1)).slice(-2);
      dd = ('0' + now.getDate()).slice(-2);
      return "" + yy + mm + dd;
    };

    HashCash.buildString = function(parts) {
      var date, ret;
      ret = "";
      if (parts.version == null) {
        return ret;
      }
      ret += "" + parts.version + ":";
      if (parts.bits == null) {
        return ret;
      }
      ret += "" + parts.bits + ":";
      if (parts.date == null) {
        return ret;
      }
      date = buildDate(parts.date);
      if (date == null) {
        return ret;
      }
      ret += "" + date + ":";
      if (parts.resource == null) {
        return ret;
      }
      ret += "" + parts.resource + ":";
      if (parts.rand == null) {
        return ret;
      }
      ret += parts.rand;
      if (parts.counter == null) {
        return ret;
      }
      return ret += ":" + parts.counter;
    };

    HashCash.testSha = function(data) {
      var sha, test;
      test = "" + data.challenge + ":" + data.counter;
      sha = sha1.hash(test);
      if (numLeading0s(sha) >= data.bits) {
        data.result = test;
      } else {
        data.counter += 1;
      }
      return void 0;
    };

    HashCash.parse = function(str) {
      var counterEnd, data, pos;
      if (str == null) {
        return null;
      }
      data = {};
      pos = {
        start: 0,
        end: -1,
        length: function() {
          return this.end - this.start;
        }
      };
      if (!nextPos(str, pos)) {
        return null;
      }
      data.version = parseInt(str.substr(pos.start, pos.length()), 10);
      if (isNaN(data.version)) {
        return null;
      }
      if (!nextPos(str, pos)) {
        return null;
      }
      data.bits = parseInt(str.substr(pos.start, pos.length()), 10);
      if (isNaN(data.bits)) {
        return null;
      }
      if (!nextPos(str, pos)) {
        return null;
      }
      data.date = parseInt(str.substr(pos.start, pos.length()), 10);
      if (isNaN(data.date)) {
        return null;
      }
      if (!nextPos(str, pos)) {
        return null;
      }
      data.resource = str.substr(pos.start, pos.length());
      if (!data.resource.length) {
        return null;
      }
      if (!nextPos(str, pos)) {
        return null;
      }
      data.rand = str.substr(pos.start, pos.length());
      if (!data.rand.length) {
        return null;
      }
      nextPos(str, pos);
      counterEnd = (pos.end === -1 ? str.length : pos.end) - pos.start;
      data.counter = parseInt(str.substr(pos.start, counterEnd), 10);
      if (isNaN(data.counter)) {
        return null;
      }
      return data;
    };

    function HashCash(_caller, _bits, _callback, _workerFile, _numWorkers) {
      this._caller = _caller;
      this._bits = _bits;
      this._callback = _callback;
      this._workerFile = _workerFile;
      this._numWorkers = _numWorkers;
      if (this._bits < HashCash.MIN_BITS) {
        this._bits = HashCash.MIN_BITS;
      }
      this._workers = [];
    }

    HashCash.prototype._resetRange = function() {
      return this.range = {
        begin: 0,
        end: -1
      };
    };

    HashCash.prototype._workerCallback = function(result) {
      this.stop();
      return this._callback.call(this._caller, result);
    };

    HashCash.prototype._workerGenerator = function(type) {
      var num, numWorkers;
      if (this._workers.length) {
        return;
      }
      if (this._numWorkers != null) {
        numWorkers = Math.min(this._numWorkers, type.MAX_NUM_WORKERS);
      } else {
        numWorkers = type.DEFAULT_NUM_WORKERS;
      }
      console.log("using " + numWorkers + " workers");
      return this._workers = (function() {
        var _i, _results;
        _results = [];
        for (num = _i = 1; 1 <= numWorkers ? _i <= numWorkers : _i >= numWorkers; num = 1 <= numWorkers ? ++_i : --_i) {
          _results.push(new type(this, this._workerCallback, this.range, this._workerFile));
        }
        return _results;
      }).call(this);
    };

    HashCash.prototype._sendData = function(data) {
      var worker, _i, _len, _ref, _results;
      _ref = this._workers;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        worker = _ref[_i];
        _results.push(worker.sendData(data));
      }
      return _results;
    };

    HashCash.prototype.stop = function() {
      var worker, _i, _len, _ref, _results;
      _ref = this._workers;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        worker = _ref[_i];
        _results.push(worker.stop());
      }
      return _results;
    };

    HashCash.prototype.generate = function(resource, callback) {
      var data, parts, type;
      this._resetRange();
      parts = {
        version: HashCash.VERSION,
        bits: this._bits,
        date: HashCash.genDate(),
        resource: resource,
        rand: Math.random().toString(36).substr(2)
      };
      data = {
        challenge: HashCash.buildString(parts),
        counter: 0,
        bits: parts.bits
      };
      /*
      Use different strategies to ensure the main javascript thread is not
      hung up while generating the HashCash
      
      1. Under Node, we use child_process
      2. In browsers that support it, use web workers
      3. In other browsers, use setTimeout
      */

      if (typeof window === "undefined" || window === null) {
        type = NodeTaskMaster;
      } else if ((typeof Worker !== "undefined" && Worker !== null) && (this._workerFile != null)) {
        type = WebTaskMaster;
      } else {
        type = TimeoutTaskMaster;
      }
      this._workerGenerator(type);
      return this._sendData(data);
    };

    HashCash.prototype.validate = function(str) {
      var data, now;
      if (str == null) {
        return false;
      }
      if (this._bits == null) {
        return false;
      }
      data = HashCash.parse(str);
      if (data == null) {
        return false;
      }
      if (data.bits < this._bits) {
        return false;
      }
      if (data.bits < HashCash.MIN_BITS) {
        return false;
      }
      if (data.version !== HashCash.VERSION) {
        return false;
      }
      now = HashCash.genDate();
      if (data.date < now - 1 || data.date > now + 1) {
        return false;
      }
      return numLeading0s(sha1.hash(str)) >= data.bits;
    };

    return HashCash;

  })();

  exports.HashCash = HashCash;

}).call(this);

},{"./sha1":4,"./taskmaster":5}],4:[function(require,module,exports){
(function() {
  var ROTL, f, toHexStr;

  ROTL = function(x, n) {
    return (x << n) | (x >>> (32 - n));
  };

  toHexStr = function(n) {
    var i, s, v, _i;
    s = "";
    for (i = _i = 7; _i >= 0; i = --_i) {
      v = (n >>> (i * 4)) & 0xf;
      s += v.toString(16);
    }
    return s;
  };

  f = function(s, x, y, z) {
    switch (s) {
      case 0:
        return (x & y) ^ (~x & z);
      case 1:
        return x ^ y ^ z;
      case 2:
        return (x & y) ^ (x & z) ^ (y & z);
      case 3:
        return x ^ y ^ z;
    }
  };

  exports.hash = function(msg) {
    var H0, H1, H2, H3, H4, K, M, N, T, TWO_TO_THIRTY_TWO, W, a, b, c, d, e, i, j, l, s, t, _i, _j, _k, _l, _m, _n, _ref, _ref1;
    K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
    msg += String.fromCharCode(0x80);
    l = msg.length / 4 + 2;
    N = Math.ceil(l / 16);
    M = [];
    for (i = _i = 0, _ref = N - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      M[i] = [];
      for (j = _j = 0; _j <= 15; j = ++_j) {
        M[i][j] = (msg.charCodeAt(i * 64 + j * 4 + 0) << 24) | (msg.charCodeAt(i * 64 + j * 4 + 1) << 16) | (msg.charCodeAt(i * 64 + j * 4 + 2) << 8) | (msg.charCodeAt(i * 64 + j * 4 + 3) << 0);
      }
    }
    TWO_TO_THIRTY_TWO = 4294967296;
    M[N - 1][14] = ((msg.length - 1) * 8) / TWO_TO_THIRTY_TWO;
    M[N - 1][14] = Math.floor(M[N - 1][14]);
    M[N - 1][15] = ((msg.length - 1) * 8) & 0xffffffff;
    H0 = 0x67452301;
    H1 = 0xefcdab89;
    H2 = 0x98badcfe;
    H3 = 0x10325476;
    H4 = 0xc3d2e1f0;
    W = [];
    for (i = _k = 0, _ref1 = N - 1; 0 <= _ref1 ? _k <= _ref1 : _k >= _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
      for (t = _l = 0; _l <= 15; t = ++_l) {
        W[t] = M[i][t];
      }
      for (t = _m = 16; _m <= 79; t = ++_m) {
        W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
      }
      a = H0;
      b = H1;
      c = H2;
      d = H3;
      e = H4;
      for (t = _n = 0; _n <= 79; t = ++_n) {
        s = Math.floor(t / 20);
        T = (ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[t]) & 0xffffffff;
        e = d;
        d = c;
        c = ROTL(b, 30);
        b = a;
        a = T;
      }
      H0 = (H0 + a) & 0xffffffff;
      H1 = (H1 + b) & 0xffffffff;
      H2 = (H2 + c) & 0xffffffff;
      H3 = (H3 + d) & 0xffffffff;
      H4 = (H4 + e) & 0xffffffff;
    }
    return toHexStr(H0) + toHexStr(H1) + toHexStr(H2) + toHexStr(H3) + toHexStr(H4);
  };

}).call(this);

},{}],6:[function(require,module,exports){

},{}],7:[function(require,module,exports){
exports.spawn = function () {};
exports.exec = function () {};

},{}],5:[function(require,module,exports){
(function(__dirname){(function() {
  var NodeTaskMaster, TaskMaster, TimeoutTaskMaster, WebTaskMaster, childProcess, hashcash, os,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  os = require("os");

  childProcess = require("child_process");

  hashcash = require("./hashcash");

  TaskMaster = (function() {
    TaskMaster.RANGE_INCREMENT = Math.pow(2, 15);

    function TaskMaster(_caller, _callback, _range) {
      this._caller = _caller;
      this._callback = _callback;
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

    TaskMaster.prototype.sendData = function(data) {
      return this._send({
        m: "data",
        data: data
      });
    };

    TaskMaster.prototype._nextRange = function() {
      this._range.begin = this._range.end + 1;
      this._range.end = this._range.begin + TaskMaster.RANGE_INCREMENT - 1;
      return this._range;
    };

    TaskMaster.prototype._sendRange = function() {
      var range;
      range = this._nextRange();
      return this._send({
        m: "range",
        range: range
      });
    };

    TaskMaster.prototype._gotResult = function(result) {
      if (result == null) {
        return;
      }
      return this._callback.call(this._caller, result);
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

    NodeTaskMaster.MAX_NUM_WORKERS = os.cpus != null ? os.cpus().length : 4;

    NodeTaskMaster.DEFAULT_NUM_WORKERS = NodeTaskMaster.MAX_NUM_WORKERS;

    function NodeTaskMaster(caller, callback, range) {
      NodeTaskMaster.__super__.constructor.call(this, caller, callback, range);
    }

    NodeTaskMaster.prototype.connect = function() {
      var me;
      this.worker = childProcess.fork(__dirname + "/worker.js");
      me = this;
      this.worker.on("message", function(data) {
        return me._gotMessage.call(me, data);
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

  WebTaskMaster = (function(_super) {
    __extends(WebTaskMaster, _super);

    WebTaskMaster.MAX_NUM_WORKERS = 8;

    WebTaskMaster.DEFAULT_NUM_WORKERS = 4;

    function WebTaskMaster(caller, callback, range, file) {
      this.file = file;
      WebTaskMaster.__super__.constructor.call(this, caller, callback, range);
    }

    WebTaskMaster.prototype.connect = function() {
      var me;
      this.worker = new Worker(this.file);
      me = this;
      this.worker.onmessage = function(event) {
        return me._gotMessage.call(me, event.data);
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

  TimeoutTaskMaster = (function() {
    TimeoutTaskMaster.MAX_RUNTIME = 99;

    TimeoutTaskMaster.YIELD_TIME = 1;

    TimeoutTaskMaster.MAX_NUM_WORKERS = 1;

    TimeoutTaskMaster.DEFAULT_NUM_WORKERS = 1;

    function TimeoutTaskMaster(_caller, _callback) {
      this._caller = _caller;
      this._callback = _callback;
    }

    TimeoutTaskMaster.prototype.sendData = function(_data) {
      this._data = _data;
      delete this._stopFlag;
      return this.start();
    };

    TimeoutTaskMaster.prototype.start = function() {
      var me, startTime;
      startTime = new Date();
      while (!((this._stopFlag != null) || (this._data.result != null) || (new Date() - startTime >= TimeoutTaskMaster.MAX_RUNTIME))) {
        hashcash.HashCash.testSha(this._data);
      }
      if (this._stopFlag != null) {

      } else if (this._data.result != null) {
        return this._callback.call(this._caller, this._data.result);
      } else {
        me = this;
        return setTimeout((function() {
          return me.start.call(me);
        }), TimeoutTaskMaster.YIELD_TIME);
      }
    };

    TimeoutTaskMaster.prototype.stop = function() {
      return this._stopFlag = true;
    };

    return TimeoutTaskMaster;

  })();

  exports.TaskMaster = TaskMaster;

  exports.NodeTaskMaster = NodeTaskMaster;

  exports.WebTaskMaster = WebTaskMaster;

  exports.TimeoutTaskMaster = TimeoutTaskMaster;

}).call(this);

})("/")
},{"os":6,"child_process":7,"./hashcash":3}]},{},[2])
;