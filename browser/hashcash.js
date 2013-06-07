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
(function() {
  "use strict";
  window.HashCash = require("./hashcash");

}).call(this);

/*
//@ sourceMappingURL=browser.js.map
*/
},{"./hashcash":2}],2:[function(require,module,exports){
(function() {
  "use strict";
  var HashCash, NodeTaskMaster, TimeoutTaskMaster, WebTaskMaster, sha1, _buildDate, _nextPos, _ref;

  sha1 = require("./sha1");

  _ref = require("./taskmaster"), NodeTaskMaster = _ref.NodeTaskMaster, WebTaskMaster = _ref.WebTaskMaster, TimeoutTaskMaster = _ref.TimeoutTaskMaster;

  _buildDate = function(date) {
    if (typeof date === "string") {
      if (date.length !== 6) {
        return null;
      }
      return date;
    }
    if (typeof date !== "number") {
      return null;
    }
    return _buildDate("" + date);
  };

  _nextPos = function(str, pos) {
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

    HashCash.hash = sha1;

    HashCash.date = function() {
      var dd, mm, now, yy;
      now = new Date();
      yy = ("0" + (now.getYear() - 100)).slice(-2);
      mm = ('0' + (now.getMonth() + 1)).slice(-2);
      dd = ('0' + now.getDate()).slice(-2);
      return "" + yy + mm + dd;
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
      if (!_nextPos(str, pos)) {
        return null;
      }
      data.version = parseInt(str.substr(pos.start, pos.length()), 10);
      if (isNaN(data.version)) {
        return null;
      }
      if (!_nextPos(str, pos)) {
        return null;
      }
      data.bits = parseInt(str.substr(pos.start, pos.length()), 10);
      if (isNaN(data.bits)) {
        return null;
      }
      if (!_nextPos(str, pos)) {
        return null;
      }
      data.date = parseInt(str.substr(pos.start, pos.length()), 10);
      if (isNaN(data.date)) {
        return null;
      }
      if (!_nextPos(str, pos)) {
        return null;
      }
      data.resource = str.substr(pos.start, pos.length());
      if (!data.resource.length) {
        return null;
      }
      if (!_nextPos(str, pos)) {
        return null;
      }
      data.rand = str.substr(pos.start, pos.length());
      if (!data.rand.length) {
        return null;
      }
      _nextPos(str, pos);
      counterEnd = (pos.end === -1 ? str.length : pos.end) - pos.start;
      data.counter = parseInt(str.substr(pos.start, counterEnd), 10);
      if (isNaN(data.counter)) {
        return null;
      }
      return data;
    };

    HashCash.unparse = function(parts) {
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
      date = _buildDate(parts.date);
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
      ret += ":" + parts.counter;
      return ret;
    };

    function HashCash(_bits, cb, caller, workerFile, numWorkers) {
      var num, type, wrappedCb;
      this._bits = _bits;
      if (this._bits < HashCash.MIN_BITS) {
        this._bits = HashCash.MIN_BITS;
      }
      this._workers = [];
      this._range = {};
      this._resetRange();
      /*
      Use different strategies to ensure the main javascript thread is not
      hung up while generating the hashcash
      
      1. Under Node, we use child_process
      2. In browsers that support it, use web workers
      3. In other browsers, use setTimeout
      */

      if (typeof window === "undefined" || window === null) {
        type = NodeTaskMaster;
      } else if ((typeof Worker !== "undefined" && Worker !== null) && (workerFile != null)) {
        type = WebTaskMaster;
      } else {
        type = TimeoutTaskMaster;
      }
      if (numWorkers != null) {
        numWorkers = Math.min(numWorkers, type.MAX_NUM_WORKERS);
      } else {
        numWorkers = type.DEFAULT_NUM_WORKERS;
      }
      if (!numWorkers) {
        return;
      }
      console.log("using " + numWorkers + " workers");
      wrappedCb = function(result) {
        this.stop();
        if (caller != null) {
          return cb.call(caller, result);
        } else {
          return cb(result);
        }
      };
      this._workers = (function() {
        var _i, _results;
        _results = [];
        for (num = _i = 1; 1 <= numWorkers ? _i <= numWorkers : _i >= numWorkers; num = 1 <= numWorkers ? ++_i : --_i) {
          _results.push(new type(this, wrappedCb, this._range, workerFile));
        }
        return _results;
      }).call(this);
    }

    HashCash.prototype._resetRange = function() {
      return this._range = {
        begin: 0,
        end: -1
      };
    };

    HashCash.prototype._sendData = function(data) {
      var worker, _i, _len, _ref1, _results;
      _ref1 = this._workers;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        worker = _ref1[_i];
        _results.push(worker.sendData(data));
      }
      return _results;
    };

    HashCash.prototype.stop = function() {
      var worker, _i, _len, _ref1, _results;
      _ref1 = this._workers;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        worker = _ref1[_i];
        _results.push(worker.stop());
      }
      return _results;
    };

    HashCash.prototype.generate = function(resource) {
      var data, parts;
      this._resetRange();
      parts = {
        version: HashCash.VERSION,
        bits: this._bits,
        date: HashCash.date(),
        resource: resource,
        rand: Math.random().toString(36).substr(2)
      };
      data = {
        challenge: HashCash.unparse(parts),
        counter: 0,
        bits: parts.bits
      };
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
      now = HashCash.date();
      if (data.date < now - 1 || data.date > now + 1) {
        return false;
      }
      return sha1.leading0s(HashCash.hash(str)) >= data.bits;
    };

    return HashCash;

  })();

  module.exports = HashCash;

}).call(this);

/*
//@ sourceMappingURL=hashcash.js.map
*/
},{"./sha1":3,"./taskmaster":4}],3:[function(require,module,exports){
(function() {
  "use strict";
  var ROTL, f, hidden, key, sha1, toHexStr, _leading0s, _sha1hash, _tryChallenge,
    __hasProp = {}.hasOwnProperty;

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

  _sha1hash = function(msg) {
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

  _leading0s = function(hexStr) {
    var curNum, num, pos, _i, _ref;
    num = 0;
    for (pos = _i = 0, _ref = hexStr.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; pos = 0 <= _ref ? ++_i : --_i) {
      curNum = parseInt(hexStr[pos], 16);
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

  _tryChallenge = function(data) {
    var challenge, sha;
    challenge = "" + data.challenge + ":" + data.counter;
    sha = _sha1hash(challenge);
    if (_leading0s(sha) >= data.bits) {
      data.result = challenge;
      return true;
    }
    data.counter += 1;
    return false;
  };

  sha1 = function(msg) {
    return _sha1hash(msg);
  };

  sha1.leading0s = function(hexStr) {
    return _leading0s(hexStr);
  };

  sha1.tryChallenge = function(data) {
    return _tryChallenge(data);
  };

  hidden = {
    writable: false,
    enumerable: false,
    configurable: false
  };

  for (key in sha1) {
    if (!__hasProp.call(sha1, key)) continue;
    Object.defineProperty(sha1, key, hidden);
  }

  module.exports = sha1;

}).call(this);

/*
//@ sourceMappingURL=sha1.js.map
*/
},{}],5:[function(require,module,exports){

},{}],6:[function(require,module,exports){
exports.spawn = function () {};
exports.exec = function () {};

},{}],4:[function(require,module,exports){
(function(__dirname){(function() {
  "use strict";
  var NodeTaskMaster, TIMEOUT_MAX_RUNTIME, TIMEOUT_YIELD_TIME, TaskMaster, TimeoutTaskMaster, WebTaskMaster, childProcess, os, sha1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  os = require("os");

  childProcess = require("child_process");

  sha1 = require("./sha1");

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

    NodeTaskMaster.MAX_NUM_WORKERS = os.cpus != null ? os.cpus().length : 4;

    NodeTaskMaster.DEFAULT_NUM_WORKERS = NodeTaskMaster.MAX_NUM_WORKERS;

    function NodeTaskMaster(caller, cb, range) {
      NodeTaskMaster.__super__.constructor.call(this, caller, cb, range);
    }

    NodeTaskMaster.prototype.connect = function() {
      var me;
      this.worker = childProcess.fork(__dirname + "/worker.js");
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

  WebTaskMaster = (function(_super) {
    __extends(WebTaskMaster, _super);

    WebTaskMaster.MAX_NUM_WORKERS = 8;

    WebTaskMaster.DEFAULT_NUM_WORKERS = 4;

    function WebTaskMaster(caller, cb, range, file) {
      this.file = file;
      WebTaskMaster.__super__.constructor.call(this, caller, cb, range);
    }

    WebTaskMaster.prototype.connect = function() {
      var me;
      this.worker = new Worker(this.file);
      me = this;
      this.worker.onmessage = function(event) {
        return me._gotMessage(event.data);
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
    TimeoutTaskMaster.MAX_NUM_WORKERS = 1;

    TimeoutTaskMaster.DEFAULT_NUM_WORKERS = 1;

    function TimeoutTaskMaster(_caller, _cb) {
      this._caller = _caller;
      this._cb = _cb;
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

  exports.NodeTaskMaster = NodeTaskMaster;

  exports.WebTaskMaster = WebTaskMaster;

  exports.TimeoutTaskMaster = TimeoutTaskMaster;

}).call(this);

/*
//@ sourceMappingURL=taskmaster.js.map
*/
})("/")
},{"os":5,"child_process":6,"./sha1":3}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvanJ1YmluL3dvcmtpbmcvbm9kZS1oYXNoY2FzaC9saWIvYnJvd3Nlci5qcyIsIi9Vc2Vycy9qcnViaW4vd29ya2luZy9ub2RlLWhhc2hjYXNoL2xpYi9oYXNoY2FzaC5qcyIsIi9Vc2Vycy9qcnViaW4vd29ya2luZy9ub2RlLWhhc2hjYXNoL2xpYi9zaGExLmpzIiwiL1VzZXJzL2pydWJpbi93b3JraW5nL25vZGUtaGFzaGNhc2gvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvX2VtcHR5LmpzIiwiL1VzZXJzL2pydWJpbi93b3JraW5nL25vZGUtaGFzaGNhc2gvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL2NoaWxkX3Byb2Nlc3MuanMiLCIvVXNlcnMvanJ1YmluL3dvcmtpbmcvbm9kZS1oYXNoY2FzaC9saWIvdGFza21hc3Rlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSkE7O0FDQUE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgd2luZG93Lkhhc2hDYXNoID0gcmVxdWlyZShcIi4vaGFzaGNhc2hcIik7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8qXG4vL0Agc291cmNlTWFwcGluZ1VSTD1icm93c2VyLmpzLm1hcFxuKi8iLCIoZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgSGFzaENhc2gsIE5vZGVUYXNrTWFzdGVyLCBUaW1lb3V0VGFza01hc3RlciwgV2ViVGFza01hc3Rlciwgc2hhMSwgX2J1aWxkRGF0ZSwgX25leHRQb3MsIF9yZWY7XG5cbiAgc2hhMSA9IHJlcXVpcmUoXCIuL3NoYTFcIik7XG5cbiAgX3JlZiA9IHJlcXVpcmUoXCIuL3Rhc2ttYXN0ZXJcIiksIE5vZGVUYXNrTWFzdGVyID0gX3JlZi5Ob2RlVGFza01hc3RlciwgV2ViVGFza01hc3RlciA9IF9yZWYuV2ViVGFza01hc3RlciwgVGltZW91dFRhc2tNYXN0ZXIgPSBfcmVmLlRpbWVvdXRUYXNrTWFzdGVyO1xuXG4gIF9idWlsZERhdGUgPSBmdW5jdGlvbihkYXRlKSB7XG4gICAgaWYgKHR5cGVvZiBkYXRlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBpZiAoZGF0ZS5sZW5ndGggIT09IDYpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkYXRlICE9PSBcIm51bWJlclwiKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIF9idWlsZERhdGUoXCJcIiArIGRhdGUpO1xuICB9O1xuXG4gIF9uZXh0UG9zID0gZnVuY3Rpb24oc3RyLCBwb3MpIHtcbiAgICBwb3Muc3RhcnQgPSBwb3MuZW5kICsgMTtcbiAgICBpZiAocG9zLnN0YXJ0ID09PSBzdHIubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHBvcy5lbmQgPSBzdHIuaW5kZXhPZignOicsIHBvcy5zdGFydCk7XG4gICAgaWYgKHBvcy5lbmQgPT09IC0xKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChwb3MuZW5kID09PSBwb3Muc3RhcnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgSGFzaENhc2ggPSAoZnVuY3Rpb24oKSB7XG4gICAgSGFzaENhc2guVkVSU0lPTiA9IDE7XG5cbiAgICBIYXNoQ2FzaC5NSU5fQklUUyA9IDE2O1xuXG4gICAgSGFzaENhc2guaGFzaCA9IHNoYTE7XG5cbiAgICBIYXNoQ2FzaC5kYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZGQsIG1tLCBub3csIHl5O1xuICAgICAgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIHl5ID0gKFwiMFwiICsgKG5vdy5nZXRZZWFyKCkgLSAxMDApKS5zbGljZSgtMik7XG4gICAgICBtbSA9ICgnMCcgKyAobm93LmdldE1vbnRoKCkgKyAxKSkuc2xpY2UoLTIpO1xuICAgICAgZGQgPSAoJzAnICsgbm93LmdldERhdGUoKSkuc2xpY2UoLTIpO1xuICAgICAgcmV0dXJuIFwiXCIgKyB5eSArIG1tICsgZGQ7XG4gICAgfTtcblxuICAgIEhhc2hDYXNoLnBhcnNlID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgICB2YXIgY291bnRlckVuZCwgZGF0YSwgcG9zO1xuICAgICAgaWYgKHN0ciA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgZGF0YSA9IHt9O1xuICAgICAgcG9zID0ge1xuICAgICAgICBzdGFydDogMCxcbiAgICAgICAgZW5kOiAtMSxcbiAgICAgICAgbGVuZ3RoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5lbmQgLSB0aGlzLnN0YXJ0O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgaWYgKCFfbmV4dFBvcyhzdHIsIHBvcykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBkYXRhLnZlcnNpb24gPSBwYXJzZUludChzdHIuc3Vic3RyKHBvcy5zdGFydCwgcG9zLmxlbmd0aCgpKSwgMTApO1xuICAgICAgaWYgKGlzTmFOKGRhdGEudmVyc2lvbikpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoIV9uZXh0UG9zKHN0ciwgcG9zKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGRhdGEuYml0cyA9IHBhcnNlSW50KHN0ci5zdWJzdHIocG9zLnN0YXJ0LCBwb3MubGVuZ3RoKCkpLCAxMCk7XG4gICAgICBpZiAoaXNOYU4oZGF0YS5iaXRzKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICghX25leHRQb3Moc3RyLCBwb3MpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgZGF0YS5kYXRlID0gcGFyc2VJbnQoc3RyLnN1YnN0cihwb3Muc3RhcnQsIHBvcy5sZW5ndGgoKSksIDEwKTtcbiAgICAgIGlmIChpc05hTihkYXRhLmRhdGUpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKCFfbmV4dFBvcyhzdHIsIHBvcykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBkYXRhLnJlc291cmNlID0gc3RyLnN1YnN0cihwb3Muc3RhcnQsIHBvcy5sZW5ndGgoKSk7XG4gICAgICBpZiAoIWRhdGEucmVzb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKCFfbmV4dFBvcyhzdHIsIHBvcykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBkYXRhLnJhbmQgPSBzdHIuc3Vic3RyKHBvcy5zdGFydCwgcG9zLmxlbmd0aCgpKTtcbiAgICAgIGlmICghZGF0YS5yYW5kLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIF9uZXh0UG9zKHN0ciwgcG9zKTtcbiAgICAgIGNvdW50ZXJFbmQgPSAocG9zLmVuZCA9PT0gLTEgPyBzdHIubGVuZ3RoIDogcG9zLmVuZCkgLSBwb3Muc3RhcnQ7XG4gICAgICBkYXRhLmNvdW50ZXIgPSBwYXJzZUludChzdHIuc3Vic3RyKHBvcy5zdGFydCwgY291bnRlckVuZCksIDEwKTtcbiAgICAgIGlmIChpc05hTihkYXRhLmNvdW50ZXIpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfTtcblxuICAgIEhhc2hDYXNoLnVucGFyc2UgPSBmdW5jdGlvbihwYXJ0cykge1xuICAgICAgdmFyIGRhdGUsIHJldDtcbiAgICAgIHJldCA9IFwiXCI7XG4gICAgICBpZiAocGFydHMudmVyc2lvbiA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG4gICAgICByZXQgKz0gXCJcIiArIHBhcnRzLnZlcnNpb24gKyBcIjpcIjtcbiAgICAgIGlmIChwYXJ0cy5iaXRzID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgIH1cbiAgICAgIHJldCArPSBcIlwiICsgcGFydHMuYml0cyArIFwiOlwiO1xuICAgICAgaWYgKHBhcnRzLmRhdGUgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfVxuICAgICAgZGF0ZSA9IF9idWlsZERhdGUocGFydHMuZGF0ZSk7XG4gICAgICBpZiAoZGF0ZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG4gICAgICByZXQgKz0gXCJcIiArIGRhdGUgKyBcIjpcIjtcbiAgICAgIGlmIChwYXJ0cy5yZXNvdXJjZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG4gICAgICByZXQgKz0gXCJcIiArIHBhcnRzLnJlc291cmNlICsgXCI6XCI7XG4gICAgICBpZiAocGFydHMucmFuZCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG4gICAgICByZXQgKz0gcGFydHMucmFuZDtcbiAgICAgIGlmIChwYXJ0cy5jb3VudGVyID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgIH1cbiAgICAgIHJldCArPSBcIjpcIiArIHBhcnRzLmNvdW50ZXI7XG4gICAgICByZXR1cm4gcmV0O1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBIYXNoQ2FzaChfYml0cywgY2IsIGNhbGxlciwgd29ya2VyRmlsZSwgbnVtV29ya2Vycykge1xuICAgICAgdmFyIG51bSwgdHlwZSwgd3JhcHBlZENiO1xuICAgICAgdGhpcy5fYml0cyA9IF9iaXRzO1xuICAgICAgaWYgKHRoaXMuX2JpdHMgPCBIYXNoQ2FzaC5NSU5fQklUUykge1xuICAgICAgICB0aGlzLl9iaXRzID0gSGFzaENhc2guTUlOX0JJVFM7XG4gICAgICB9XG4gICAgICB0aGlzLl93b3JrZXJzID0gW107XG4gICAgICB0aGlzLl9yYW5nZSA9IHt9O1xuICAgICAgdGhpcy5fcmVzZXRSYW5nZSgpO1xuICAgICAgLypcbiAgICAgIFVzZSBkaWZmZXJlbnQgc3RyYXRlZ2llcyB0byBlbnN1cmUgdGhlIG1haW4gamF2YXNjcmlwdCB0aHJlYWQgaXMgbm90XG4gICAgICBodW5nIHVwIHdoaWxlIGdlbmVyYXRpbmcgdGhlIGhhc2hjYXNoXG4gICAgICBcbiAgICAgIDEuIFVuZGVyIE5vZGUsIHdlIHVzZSBjaGlsZF9wcm9jZXNzXG4gICAgICAyLiBJbiBicm93c2VycyB0aGF0IHN1cHBvcnQgaXQsIHVzZSB3ZWIgd29ya2Vyc1xuICAgICAgMy4gSW4gb3RoZXIgYnJvd3NlcnMsIHVzZSBzZXRUaW1lb3V0XG4gICAgICAqL1xuXG4gICAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gXCJ1bmRlZmluZWRcIiB8fCB3aW5kb3cgPT09IG51bGwpIHtcbiAgICAgICAgdHlwZSA9IE5vZGVUYXNrTWFzdGVyO1xuICAgICAgfSBlbHNlIGlmICgodHlwZW9mIFdvcmtlciAhPT0gXCJ1bmRlZmluZWRcIiAmJiBXb3JrZXIgIT09IG51bGwpICYmICh3b3JrZXJGaWxlICE9IG51bGwpKSB7XG4gICAgICAgIHR5cGUgPSBXZWJUYXNrTWFzdGVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHlwZSA9IFRpbWVvdXRUYXNrTWFzdGVyO1xuICAgICAgfVxuICAgICAgaWYgKG51bVdvcmtlcnMgIT0gbnVsbCkge1xuICAgICAgICBudW1Xb3JrZXJzID0gTWF0aC5taW4obnVtV29ya2VycywgdHlwZS5NQVhfTlVNX1dPUktFUlMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbnVtV29ya2VycyA9IHR5cGUuREVGQVVMVF9OVU1fV09SS0VSUztcbiAgICAgIH1cbiAgICAgIGlmICghbnVtV29ya2Vycykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhcInVzaW5nIFwiICsgbnVtV29ya2VycyArIFwiIHdvcmtlcnNcIik7XG4gICAgICB3cmFwcGVkQ2IgPSBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIGlmIChjYWxsZXIgIT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBjYi5jYWxsKGNhbGxlciwgcmVzdWx0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gY2IocmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHRoaXMuX3dvcmtlcnMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfaSwgX3Jlc3VsdHM7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIGZvciAobnVtID0gX2kgPSAxOyAxIDw9IG51bVdvcmtlcnMgPyBfaSA8PSBudW1Xb3JrZXJzIDogX2kgPj0gbnVtV29ya2VyczsgbnVtID0gMSA8PSBudW1Xb3JrZXJzID8gKytfaSA6IC0tX2kpIHtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKG5ldyB0eXBlKHRoaXMsIHdyYXBwZWRDYiwgdGhpcy5fcmFuZ2UsIHdvcmtlckZpbGUpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9KS5jYWxsKHRoaXMpO1xuICAgIH1cblxuICAgIEhhc2hDYXNoLnByb3RvdHlwZS5fcmVzZXRSYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3JhbmdlID0ge1xuICAgICAgICBiZWdpbjogMCxcbiAgICAgICAgZW5kOiAtMVxuICAgICAgfTtcbiAgICB9O1xuXG4gICAgSGFzaENhc2gucHJvdG90eXBlLl9zZW5kRGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciB3b3JrZXIsIF9pLCBfbGVuLCBfcmVmMSwgX3Jlc3VsdHM7XG4gICAgICBfcmVmMSA9IHRoaXMuX3dvcmtlcnM7XG4gICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmMS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICB3b3JrZXIgPSBfcmVmMVtfaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2god29ya2VyLnNlbmREYXRhKGRhdGEpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICB9O1xuXG4gICAgSGFzaENhc2gucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB3b3JrZXIsIF9pLCBfbGVuLCBfcmVmMSwgX3Jlc3VsdHM7XG4gICAgICBfcmVmMSA9IHRoaXMuX3dvcmtlcnM7XG4gICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmMS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICB3b3JrZXIgPSBfcmVmMVtfaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2god29ya2VyLnN0b3AoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgfTtcblxuICAgIEhhc2hDYXNoLnByb3RvdHlwZS5nZW5lcmF0ZSA9IGZ1bmN0aW9uKHJlc291cmNlKSB7XG4gICAgICB2YXIgZGF0YSwgcGFydHM7XG4gICAgICB0aGlzLl9yZXNldFJhbmdlKCk7XG4gICAgICBwYXJ0cyA9IHtcbiAgICAgICAgdmVyc2lvbjogSGFzaENhc2guVkVSU0lPTixcbiAgICAgICAgYml0czogdGhpcy5fYml0cyxcbiAgICAgICAgZGF0ZTogSGFzaENhc2guZGF0ZSgpLFxuICAgICAgICByZXNvdXJjZTogcmVzb3VyY2UsXG4gICAgICAgIHJhbmQ6IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cigyKVxuICAgICAgfTtcbiAgICAgIGRhdGEgPSB7XG4gICAgICAgIGNoYWxsZW5nZTogSGFzaENhc2gudW5wYXJzZShwYXJ0cyksXG4gICAgICAgIGNvdW50ZXI6IDAsXG4gICAgICAgIGJpdHM6IHBhcnRzLmJpdHNcbiAgICAgIH07XG4gICAgICByZXR1cm4gdGhpcy5fc2VuZERhdGEoZGF0YSk7XG4gICAgfTtcblxuICAgIEhhc2hDYXNoLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHN0cikge1xuICAgICAgdmFyIGRhdGEsIG5vdztcbiAgICAgIGlmIChzdHIgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fYml0cyA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGRhdGEgPSBIYXNoQ2FzaC5wYXJzZShzdHIpO1xuICAgICAgaWYgKGRhdGEgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoZGF0YS5iaXRzIDwgdGhpcy5fYml0cykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoZGF0YS5iaXRzIDwgSGFzaENhc2guTUlOX0JJVFMpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKGRhdGEudmVyc2lvbiAhPT0gSGFzaENhc2guVkVSU0lPTikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBub3cgPSBIYXNoQ2FzaC5kYXRlKCk7XG4gICAgICBpZiAoZGF0YS5kYXRlIDwgbm93IC0gMSB8fCBkYXRhLmRhdGUgPiBub3cgKyAxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzaGExLmxlYWRpbmcwcyhIYXNoQ2FzaC5oYXNoKHN0cikpID49IGRhdGEuYml0cztcbiAgICB9O1xuXG4gICAgcmV0dXJuIEhhc2hDYXNoO1xuXG4gIH0pKCk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBIYXNoQ2FzaDtcblxufSkuY2FsbCh0aGlzKTtcblxuLypcbi8vQCBzb3VyY2VNYXBwaW5nVVJMPWhhc2hjYXNoLmpzLm1hcFxuKi8iLCIoZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgUk9UTCwgZiwgaGlkZGVuLCBrZXksIHNoYTEsIHRvSGV4U3RyLCBfbGVhZGluZzBzLCBfc2hhMWhhc2gsIF90cnlDaGFsbGVuZ2UsXG4gICAgX19oYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgUk9UTCA9IGZ1bmN0aW9uKHgsIG4pIHtcbiAgICByZXR1cm4gKHggPDwgbikgfCAoeCA+Pj4gKDMyIC0gbikpO1xuICB9O1xuXG4gIHRvSGV4U3RyID0gZnVuY3Rpb24obikge1xuICAgIHZhciBpLCBzLCB2LCBfaTtcbiAgICBzID0gXCJcIjtcbiAgICBmb3IgKGkgPSBfaSA9IDc7IF9pID49IDA7IGkgPSAtLV9pKSB7XG4gICAgICB2ID0gKG4gPj4+IChpICogNCkpICYgMHhmO1xuICAgICAgcyArPSB2LnRvU3RyaW5nKDE2KTtcbiAgICB9XG4gICAgcmV0dXJuIHM7XG4gIH07XG5cbiAgZiA9IGZ1bmN0aW9uKHMsIHgsIHksIHopIHtcbiAgICBzd2l0Y2ggKHMpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgcmV0dXJuICh4ICYgeSkgXiAofnggJiB6KTtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgcmV0dXJuIHggXiB5IF4gejtcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgcmV0dXJuICh4ICYgeSkgXiAoeCAmIHopIF4gKHkgJiB6KTtcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgcmV0dXJuIHggXiB5IF4gejtcbiAgICB9XG4gIH07XG5cbiAgX3NoYTFoYXNoID0gZnVuY3Rpb24obXNnKSB7XG4gICAgdmFyIEgwLCBIMSwgSDIsIEgzLCBINCwgSywgTSwgTiwgVCwgVFdPX1RPX1RISVJUWV9UV08sIFcsIGEsIGIsIGMsIGQsIGUsIGksIGosIGwsIHMsIHQsIF9pLCBfaiwgX2ssIF9sLCBfbSwgX24sIF9yZWYsIF9yZWYxO1xuICAgIEsgPSBbMHg1YTgyNzk5OSwgMHg2ZWQ5ZWJhMSwgMHg4ZjFiYmNkYywgMHhjYTYyYzFkNl07XG4gICAgbXNnICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoMHg4MCk7XG4gICAgbCA9IG1zZy5sZW5ndGggLyA0ICsgMjtcbiAgICBOID0gTWF0aC5jZWlsKGwgLyAxNik7XG4gICAgTSA9IFtdO1xuICAgIGZvciAoaSA9IF9pID0gMCwgX3JlZiA9IE4gLSAxOyAwIDw9IF9yZWYgPyBfaSA8PSBfcmVmIDogX2kgPj0gX3JlZjsgaSA9IDAgPD0gX3JlZiA/ICsrX2kgOiAtLV9pKSB7XG4gICAgICBNW2ldID0gW107XG4gICAgICBmb3IgKGogPSBfaiA9IDA7IF9qIDw9IDE1OyBqID0gKytfaikge1xuICAgICAgICBNW2ldW2pdID0gKG1zZy5jaGFyQ29kZUF0KGkgKiA2NCArIGogKiA0ICsgMCkgPDwgMjQpIHwgKG1zZy5jaGFyQ29kZUF0KGkgKiA2NCArIGogKiA0ICsgMSkgPDwgMTYpIHwgKG1zZy5jaGFyQ29kZUF0KGkgKiA2NCArIGogKiA0ICsgMikgPDwgOCkgfCAobXNnLmNoYXJDb2RlQXQoaSAqIDY0ICsgaiAqIDQgKyAzKSA8PCAwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgVFdPX1RPX1RISVJUWV9UV08gPSA0Mjk0OTY3Mjk2O1xuICAgIE1bTiAtIDFdWzE0XSA9ICgobXNnLmxlbmd0aCAtIDEpICogOCkgLyBUV09fVE9fVEhJUlRZX1RXTztcbiAgICBNW04gLSAxXVsxNF0gPSBNYXRoLmZsb29yKE1bTiAtIDFdWzE0XSk7XG4gICAgTVtOIC0gMV1bMTVdID0gKChtc2cubGVuZ3RoIC0gMSkgKiA4KSAmIDB4ZmZmZmZmZmY7XG4gICAgSDAgPSAweDY3NDUyMzAxO1xuICAgIEgxID0gMHhlZmNkYWI4OTtcbiAgICBIMiA9IDB4OThiYWRjZmU7XG4gICAgSDMgPSAweDEwMzI1NDc2O1xuICAgIEg0ID0gMHhjM2QyZTFmMDtcbiAgICBXID0gW107XG4gICAgZm9yIChpID0gX2sgPSAwLCBfcmVmMSA9IE4gLSAxOyAwIDw9IF9yZWYxID8gX2sgPD0gX3JlZjEgOiBfayA+PSBfcmVmMTsgaSA9IDAgPD0gX3JlZjEgPyArK19rIDogLS1faykge1xuICAgICAgZm9yICh0ID0gX2wgPSAwOyBfbCA8PSAxNTsgdCA9ICsrX2wpIHtcbiAgICAgICAgV1t0XSA9IE1baV1bdF07XG4gICAgICB9XG4gICAgICBmb3IgKHQgPSBfbSA9IDE2OyBfbSA8PSA3OTsgdCA9ICsrX20pIHtcbiAgICAgICAgV1t0XSA9IFJPVEwoV1t0IC0gM10gXiBXW3QgLSA4XSBeIFdbdCAtIDE0XSBeIFdbdCAtIDE2XSwgMSk7XG4gICAgICB9XG4gICAgICBhID0gSDA7XG4gICAgICBiID0gSDE7XG4gICAgICBjID0gSDI7XG4gICAgICBkID0gSDM7XG4gICAgICBlID0gSDQ7XG4gICAgICBmb3IgKHQgPSBfbiA9IDA7IF9uIDw9IDc5OyB0ID0gKytfbikge1xuICAgICAgICBzID0gTWF0aC5mbG9vcih0IC8gMjApO1xuICAgICAgICBUID0gKFJPVEwoYSwgNSkgKyBmKHMsIGIsIGMsIGQpICsgZSArIEtbc10gKyBXW3RdKSAmIDB4ZmZmZmZmZmY7XG4gICAgICAgIGUgPSBkO1xuICAgICAgICBkID0gYztcbiAgICAgICAgYyA9IFJPVEwoYiwgMzApO1xuICAgICAgICBiID0gYTtcbiAgICAgICAgYSA9IFQ7XG4gICAgICB9XG4gICAgICBIMCA9IChIMCArIGEpICYgMHhmZmZmZmZmZjtcbiAgICAgIEgxID0gKEgxICsgYikgJiAweGZmZmZmZmZmO1xuICAgICAgSDIgPSAoSDIgKyBjKSAmIDB4ZmZmZmZmZmY7XG4gICAgICBIMyA9IChIMyArIGQpICYgMHhmZmZmZmZmZjtcbiAgICAgIEg0ID0gKEg0ICsgZSkgJiAweGZmZmZmZmZmO1xuICAgIH1cbiAgICByZXR1cm4gdG9IZXhTdHIoSDApICsgdG9IZXhTdHIoSDEpICsgdG9IZXhTdHIoSDIpICsgdG9IZXhTdHIoSDMpICsgdG9IZXhTdHIoSDQpO1xuICB9O1xuXG4gIF9sZWFkaW5nMHMgPSBmdW5jdGlvbihoZXhTdHIpIHtcbiAgICB2YXIgY3VyTnVtLCBudW0sIHBvcywgX2ksIF9yZWY7XG4gICAgbnVtID0gMDtcbiAgICBmb3IgKHBvcyA9IF9pID0gMCwgX3JlZiA9IGhleFN0ci5sZW5ndGggLSAxOyAwIDw9IF9yZWYgPyBfaSA8PSBfcmVmIDogX2kgPj0gX3JlZjsgcG9zID0gMCA8PSBfcmVmID8gKytfaSA6IC0tX2kpIHtcbiAgICAgIGN1ck51bSA9IHBhcnNlSW50KGhleFN0cltwb3NdLCAxNik7XG4gICAgICBpZiAoaXNOYU4oY3VyTnVtKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHN3aXRjaCAoY3VyTnVtKSB7XG4gICAgICAgIGNhc2UgMHgwOlxuICAgICAgICAgIG51bSArPSA0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDB4MTpcbiAgICAgICAgICByZXR1cm4gbnVtICsgMztcbiAgICAgICAgY2FzZSAweDI6XG4gICAgICAgIGNhc2UgMHgzOlxuICAgICAgICAgIHJldHVybiBudW0gKyAyO1xuICAgICAgICBjYXNlIDB4NDpcbiAgICAgICAgY2FzZSAweDU6XG4gICAgICAgIGNhc2UgMHg2OlxuICAgICAgICBjYXNlIDB4NzpcbiAgICAgICAgICByZXR1cm4gbnVtICsgMTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gbnVtO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVtO1xuICB9O1xuXG4gIF90cnlDaGFsbGVuZ2UgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIGNoYWxsZW5nZSwgc2hhO1xuICAgIGNoYWxsZW5nZSA9IFwiXCIgKyBkYXRhLmNoYWxsZW5nZSArIFwiOlwiICsgZGF0YS5jb3VudGVyO1xuICAgIHNoYSA9IF9zaGExaGFzaChjaGFsbGVuZ2UpO1xuICAgIGlmIChfbGVhZGluZzBzKHNoYSkgPj0gZGF0YS5iaXRzKSB7XG4gICAgICBkYXRhLnJlc3VsdCA9IGNoYWxsZW5nZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBkYXRhLmNvdW50ZXIgKz0gMTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgc2hhMSA9IGZ1bmN0aW9uKG1zZykge1xuICAgIHJldHVybiBfc2hhMWhhc2gobXNnKTtcbiAgfTtcblxuICBzaGExLmxlYWRpbmcwcyA9IGZ1bmN0aW9uKGhleFN0cikge1xuICAgIHJldHVybiBfbGVhZGluZzBzKGhleFN0cik7XG4gIH07XG5cbiAgc2hhMS50cnlDaGFsbGVuZ2UgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgcmV0dXJuIF90cnlDaGFsbGVuZ2UoZGF0YSk7XG4gIH07XG5cbiAgaGlkZGVuID0ge1xuICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlXG4gIH07XG5cbiAgZm9yIChrZXkgaW4gc2hhMSkge1xuICAgIGlmICghX19oYXNQcm9wLmNhbGwoc2hhMSwga2V5KSkgY29udGludWU7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHNoYTEsIGtleSwgaGlkZGVuKTtcbiAgfVxuXG4gIG1vZHVsZS5leHBvcnRzID0gc2hhMTtcblxufSkuY2FsbCh0aGlzKTtcblxuLypcbi8vQCBzb3VyY2VNYXBwaW5nVVJMPXNoYTEuanMubWFwXG4qLyIsbnVsbCwiZXhwb3J0cy5zcGF3biA9IGZ1bmN0aW9uICgpIHt9O1xuZXhwb3J0cy5leGVjID0gZnVuY3Rpb24gKCkge307XG4iLCIoZnVuY3Rpb24oX19kaXJuYW1lKXsoZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgTm9kZVRhc2tNYXN0ZXIsIFRJTUVPVVRfTUFYX1JVTlRJTUUsIFRJTUVPVVRfWUlFTERfVElNRSwgVGFza01hc3RlciwgVGltZW91dFRhc2tNYXN0ZXIsIFdlYlRhc2tNYXN0ZXIsIGNoaWxkUHJvY2Vzcywgb3MsIHNoYTEsXG4gICAgX19oYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHksXG4gICAgX19leHRlbmRzID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChfX2hhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH07XG5cbiAgb3MgPSByZXF1aXJlKFwib3NcIik7XG5cbiAgY2hpbGRQcm9jZXNzID0gcmVxdWlyZShcImNoaWxkX3Byb2Nlc3NcIik7XG5cbiAgc2hhMSA9IHJlcXVpcmUoXCIuL3NoYTFcIik7XG5cbiAgVElNRU9VVF9NQVhfUlVOVElNRSA9IDk5O1xuXG4gIFRJTUVPVVRfWUlFTERfVElNRSA9IDE7XG5cbiAgVGFza01hc3RlciA9IChmdW5jdGlvbigpIHtcbiAgICBUYXNrTWFzdGVyLlJBTkdFX0lOQ1JFTUVOVCA9IE1hdGgucG93KDIsIDE1KTtcblxuICAgIGZ1bmN0aW9uIFRhc2tNYXN0ZXIoX2NhbGxlciwgX2NiLCBfcmFuZ2UpIHtcbiAgICAgIHRoaXMuX2NhbGxlciA9IF9jYWxsZXI7XG4gICAgICB0aGlzLl9jYiA9IF9jYjtcbiAgICAgIHRoaXMuX3JhbmdlID0gX3JhbmdlO1xuICAgIH1cblxuICAgIFRhc2tNYXN0ZXIucHJvdG90eXBlLl9zZW5kID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgdGhpcy5fc3Bhd24oKTtcbiAgICAgIGlmICh0aGlzLnNlbmRGbiA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnNlbmRGbihkYXRhKTtcbiAgICB9O1xuXG4gICAgVGFza01hc3Rlci5wcm90b3R5cGUuX3NwYXduID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAodGhpcy53b3JrZXIgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5jb25uZWN0KCk7XG4gICAgfTtcblxuICAgIFRhc2tNYXN0ZXIucHJvdG90eXBlLl9pbmNSYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fcmFuZ2UuYmVnaW4gPSB0aGlzLl9yYW5nZS5lbmQgKyAxO1xuICAgICAgcmV0dXJuIHRoaXMuX3JhbmdlLmVuZCA9IHRoaXMuX3JhbmdlLmJlZ2luICsgVGFza01hc3Rlci5SQU5HRV9JTkNSRU1FTlQgLSAxO1xuICAgIH07XG5cbiAgICBUYXNrTWFzdGVyLnByb3RvdHlwZS5fc2VuZFJhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9pbmNSYW5nZSgpO1xuICAgICAgcmV0dXJuIHRoaXMuX3NlbmQoe1xuICAgICAgICBtOiBcInJhbmdlXCIsXG4gICAgICAgIHJhbmdlOiB0aGlzLl9yYW5nZVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIFRhc2tNYXN0ZXIucHJvdG90eXBlLl9nb3RSZXN1bHQgPSBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgIGlmIChyZXN1bHQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fY2IuY2FsbCh0aGlzLl9jYWxsZXIsIHJlc3VsdCk7XG4gICAgfTtcblxuICAgIFRhc2tNYXN0ZXIucHJvdG90eXBlLl9nb3RNZXNzYWdlID0gZnVuY3Rpb24obXNnKSB7XG4gICAgICBpZiAoKG1zZyAhPSBudWxsID8gbXNnLm0gOiB2b2lkIDApID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChtc2cubSkge1xuICAgICAgICBjYXNlIFwicmVxdWVzdF9yYW5nZVwiOlxuICAgICAgICAgIHJldHVybiB0aGlzLl9zZW5kUmFuZ2UoKTtcbiAgICAgICAgY2FzZSBcInJlc3VsdFwiOlxuICAgICAgICAgIHJldHVybiB0aGlzLl9nb3RSZXN1bHQobXNnLnJlc3VsdCk7XG4gICAgICAgIGNhc2UgXCJjb25zb2xlX2xvZ1wiOlxuICAgICAgICAgIHJldHVybiBjb25zb2xlLmxvZyhcIndvcmtlclwiLCBtc2cuZGF0YSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIFRhc2tNYXN0ZXIucHJvdG90eXBlLnNlbmREYXRhID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIHRoaXMuX3NlbmQoe1xuICAgICAgICBtOiBcImRhdGFcIixcbiAgICAgICAgZGF0YTogZGF0YVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIFRhc2tNYXN0ZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLndvcmtlciA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgICAgZGVsZXRlIHRoaXMud29ya2VyO1xuICAgICAgcmV0dXJuIGRlbGV0ZSB0aGlzLnNlbmRGbjtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFRhc2tNYXN0ZXI7XG5cbiAgfSkoKTtcblxuICBOb2RlVGFza01hc3RlciA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoTm9kZVRhc2tNYXN0ZXIsIF9zdXBlcik7XG5cbiAgICBOb2RlVGFza01hc3Rlci5NQVhfTlVNX1dPUktFUlMgPSBvcy5jcHVzICE9IG51bGwgPyBvcy5jcHVzKCkubGVuZ3RoIDogNDtcblxuICAgIE5vZGVUYXNrTWFzdGVyLkRFRkFVTFRfTlVNX1dPUktFUlMgPSBOb2RlVGFza01hc3Rlci5NQVhfTlVNX1dPUktFUlM7XG5cbiAgICBmdW5jdGlvbiBOb2RlVGFza01hc3RlcihjYWxsZXIsIGNiLCByYW5nZSkge1xuICAgICAgTm9kZVRhc2tNYXN0ZXIuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgY2FsbGVyLCBjYiwgcmFuZ2UpO1xuICAgIH1cblxuICAgIE5vZGVUYXNrTWFzdGVyLnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbWU7XG4gICAgICB0aGlzLndvcmtlciA9IGNoaWxkUHJvY2Vzcy5mb3JrKF9fZGlybmFtZSArIFwiL3dvcmtlci5qc1wiKTtcbiAgICAgIG1lID0gdGhpcztcbiAgICAgIHRoaXMud29ya2VyLm9uKFwibWVzc2FnZVwiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHJldHVybiBtZS5fZ290TWVzc2FnZShkYXRhKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaXMuc2VuZEZuID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICByZXR1cm4gdGhpcy53b3JrZXIuc2VuZChkYXRhKTtcbiAgICAgIH07XG4gICAgfTtcblxuICAgIE5vZGVUYXNrTWFzdGVyLnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy53b3JrZXIuZGlzY29ubmVjdCgpO1xuICAgIH07XG5cbiAgICByZXR1cm4gTm9kZVRhc2tNYXN0ZXI7XG5cbiAgfSkoVGFza01hc3Rlcik7XG5cbiAgV2ViVGFza01hc3RlciA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoV2ViVGFza01hc3RlciwgX3N1cGVyKTtcblxuICAgIFdlYlRhc2tNYXN0ZXIuTUFYX05VTV9XT1JLRVJTID0gODtcblxuICAgIFdlYlRhc2tNYXN0ZXIuREVGQVVMVF9OVU1fV09SS0VSUyA9IDQ7XG5cbiAgICBmdW5jdGlvbiBXZWJUYXNrTWFzdGVyKGNhbGxlciwgY2IsIHJhbmdlLCBmaWxlKSB7XG4gICAgICB0aGlzLmZpbGUgPSBmaWxlO1xuICAgICAgV2ViVGFza01hc3Rlci5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCBjYWxsZXIsIGNiLCByYW5nZSk7XG4gICAgfVxuXG4gICAgV2ViVGFza01hc3Rlci5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG1lO1xuICAgICAgdGhpcy53b3JrZXIgPSBuZXcgV29ya2VyKHRoaXMuZmlsZSk7XG4gICAgICBtZSA9IHRoaXM7XG4gICAgICB0aGlzLndvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICByZXR1cm4gbWUuX2dvdE1lc3NhZ2UoZXZlbnQuZGF0YSk7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIHRoaXMuc2VuZEZuID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICByZXR1cm4gdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoZGF0YSk7XG4gICAgICB9O1xuICAgIH07XG5cbiAgICBXZWJUYXNrTWFzdGVyLnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy53b3JrZXIudGVybWluYXRlKCk7XG4gICAgfTtcblxuICAgIHJldHVybiBXZWJUYXNrTWFzdGVyO1xuXG4gIH0pKFRhc2tNYXN0ZXIpO1xuXG4gIFRpbWVvdXRUYXNrTWFzdGVyID0gKGZ1bmN0aW9uKCkge1xuICAgIFRpbWVvdXRUYXNrTWFzdGVyLk1BWF9OVU1fV09SS0VSUyA9IDE7XG5cbiAgICBUaW1lb3V0VGFza01hc3Rlci5ERUZBVUxUX05VTV9XT1JLRVJTID0gMTtcblxuICAgIGZ1bmN0aW9uIFRpbWVvdXRUYXNrTWFzdGVyKF9jYWxsZXIsIF9jYikge1xuICAgICAgdGhpcy5fY2FsbGVyID0gX2NhbGxlcjtcbiAgICAgIHRoaXMuX2NiID0gX2NiO1xuICAgIH1cblxuICAgIFRpbWVvdXRUYXNrTWFzdGVyLnByb3RvdHlwZS5zZW5kRGF0YSA9IGZ1bmN0aW9uKF9kYXRhKSB7XG4gICAgICB0aGlzLl9kYXRhID0gX2RhdGE7XG4gICAgICBkZWxldGUgdGhpcy5fc3RvcEZsYWc7XG4gICAgICByZXR1cm4gdGhpcy5zdGFydCgpO1xuICAgIH07XG5cbiAgICBUaW1lb3V0VGFza01hc3Rlci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBtZSwgc3RhcnRUaW1lO1xuICAgICAgc3RhcnRUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgIHdoaWxlICghKCh0aGlzLl9zdG9wRmxhZyAhPSBudWxsKSB8fCAodGhpcy5fZGF0YS5yZXN1bHQgIT0gbnVsbCkgfHwgKG5ldyBEYXRlKCkgLSBzdGFydFRpbWUgPj0gVElNRU9VVF9NQVhfUlVOVElNRSkpKSB7XG4gICAgICAgIHNoYTEudHJ5Q2hhbGxlbmdlKHRoaXMuX2RhdGEpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX3N0b3BGbGFnICE9IG51bGwpIHtcblxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9kYXRhLnJlc3VsdCAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jYi5jYWxsKHRoaXMuX2NhbGxlciwgdGhpcy5fZGF0YS5yZXN1bHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWUgPSB0aGlzO1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dCgoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIG1lLnN0YXJ0KCk7XG4gICAgICAgIH0pLCBUSU1FT1VUX1lJRUxEX1RJTUUpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBUaW1lb3V0VGFza01hc3Rlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3N0b3BGbGFnID0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFRpbWVvdXRUYXNrTWFzdGVyO1xuXG4gIH0pKCk7XG5cbiAgZXhwb3J0cy5Ob2RlVGFza01hc3RlciA9IE5vZGVUYXNrTWFzdGVyO1xuXG4gIGV4cG9ydHMuV2ViVGFza01hc3RlciA9IFdlYlRhc2tNYXN0ZXI7XG5cbiAgZXhwb3J0cy5UaW1lb3V0VGFza01hc3RlciA9IFRpbWVvdXRUYXNrTWFzdGVyO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vKlxuLy9AIHNvdXJjZU1hcHBpbmdVUkw9dGFza21hc3Rlci5qcy5tYXBcbiovXG59KShcIi9cIikiXX0=
;