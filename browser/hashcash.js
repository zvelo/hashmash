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

;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0](function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function() {
  "use strict";
  window.HashCash = require("./hashcash.coffee");

}).call(this);


},{"./hashcash.coffee":2}],2:[function(require,module,exports){
(function() {
  "use strict";
  var HashCash, NodeTaskMaster, TimeoutTaskMaster, WebTaskMaster, properties, sha1, taskmaster, _buildDate, _nextPos;

  sha1 = require("./sha1.coffee");

  taskmaster = require("./taskmaster.coffee");

  properties = require("./properties.coffee");

  NodeTaskMaster = taskmaster.NodeTaskMaster;

  WebTaskMaster = taskmaster.WebTaskMaster;

  TimeoutTaskMaster = taskmaster.TimeoutTaskMaster;

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
      var num, type, worker, wrappedCb;
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
          worker = new type(this, wrappedCb, this._range, workerFile);
          _results.push(worker);
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


},{"./sha1.coffee":3,"./taskmaster.coffee":4,"./properties.coffee":5}],3:[function(require,module,exports){
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


},{}],5:[function(require,module,exports){
(function() {
  "use strict";
  var HIDDEN_READ_ONLY, READ_ONLY,
    __hasProp = {}.hasOwnProperty;

  READ_ONLY = {
    writable: false,
    enumerable: true,
    configurable: false
  };

  HIDDEN_READ_ONLY = {
    writable: false,
    enumerable: false,
    configurable: false
  };

  exports.makeReadOnly = function(type) {
    var key, _results;
    if (Object.defineProperty != null) {
      _results = [];
      for (key in type) {
        if (!__hasProp.call(type, key)) continue;
        if (typeof key === "string" && key[0] === '_') {
          _results.push(Object.defineProperty(type, key, {
            enumerable: false
          }));
        }
      }
      return _results;
    }
  };

}).call(this);


},{}],6:[function(require,module,exports){
exports.spawn = function () {};
exports.exec = function () {};

},{}],4:[function(require,module,exports){
(function(__dirname){(function() {
  "use strict";
  var NodeTaskMaster, TIMEOUT_MAX_RUNTIME, TIMEOUT_YIELD_TIME, TaskMaster, TimeoutTaskMaster, WebTaskMaster, childProcess, properties, sha1, type, _i, _len, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  childProcess = require("child_process");

  sha1 = require("./sha1.coffee");

  properties = require("./properties.coffee");

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


})("/")
},{"child_process":6,"./properties.coffee":5,"./sha1.coffee":3}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qcnViaW4vd29ya2luZy9ub2RlLWhhc2hjYXNoL2xpYi9icm93c2VyLmNvZmZlZSIsIi9ob21lL2pydWJpbi93b3JraW5nL25vZGUtaGFzaGNhc2gvbGliL2hhc2hjYXNoLmNvZmZlZSIsIi9ob21lL2pydWJpbi93b3JraW5nL25vZGUtaGFzaGNhc2gvbGliL3NoYTEuY29mZmVlIiwiL2hvbWUvanJ1YmluL3dvcmtpbmcvbm9kZS1oYXNoY2FzaC9saWIvcHJvcGVydGllcy5jb2ZmZWUiLCIvaG9tZS9qcnViaW4vd29ya2luZy9ub2RlLWhhc2hjYXNoL25vZGVfbW9kdWxlcy9ncnVudC1jb2ZmZWVpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL2NoaWxkX3Byb2Nlc3MuanMiLCIvaG9tZS9qcnViaW4vd29ya2luZy9ub2RlLWhhc2hjYXNoL2xpYi90YXNrbWFzdGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Q0FBQSxDQUFBLFVBQUE7Q0FBQSxDQUNBLENBQWtCLEdBQVosQ0FBWSxDQUFsQixXQUFrQjtDQURsQjs7Ozs7QUNBQTtDQUFBLENBQUEsVUFBQTtDQUFBLEtBQUEsd0dBQUE7O0NBQUEsQ0FJQSxDQUFhLENBQWIsR0FBYSxRQUFBOztDQUpiLENBS0EsQ0FBYSxJQUFBLEdBQWIsV0FBYTs7Q0FMYixDQU1BLENBQWEsSUFBQSxHQUFiLFdBQWE7O0NBTmIsQ0FRQSxDQUFvQixPQUFVLElBQTlCOztDQVJBLENBU0EsQ0FBb0IsT0FBVSxHQUE5Qjs7Q0FUQSxDQVVBLENBQW9CLE9BQVUsT0FBOUI7O0NBVkEsQ0FlQSxDQUFhLENBQUEsS0FBQyxDQUFkO0FBQ0ssQ0FBSCxHQUFBLENBQW1CLENBQWhCLEVBQUg7Q0FDRSxHQUFlLENBQWlCLENBQWhDO0NBQUEsR0FBQSxXQUFPO1FBQVA7Q0FDQSxHQUFBLFNBQU87TUFGVDtBQUllLENBQWYsR0FBQSxDQUFpQyxDQUFsQixFQUFmO0NBQUEsR0FBQSxTQUFPO01BSlA7Q0FNQSxDQUFrQixDQUFFLENBQWIsTUFBQSxDQUFBO0NBdEJULEVBZWE7O0NBZmIsQ0F3QkEsQ0FBVyxLQUFYLENBQVk7Q0FDVixFQUFHLENBQUgsQ0FBQTtDQUNBLEVBQW1CLENBQW5CLENBQWdCLENBQWhCO0NBQUEsSUFBQSxRQUFPO01BRFA7Q0FBQSxDQUUyQixDQUF4QixDQUFILENBQVUsRUFBQTtBQUNrQixDQUE1QixFQUFtQixDQUFuQixDQUEyQjtDQUEzQixJQUFBLFFBQU87TUFIUDtDQUlBLEVBQW1CLENBQW5CLENBQTJCO0NBQTNCLElBQUEsUUFBTztNQUpQO0NBRFMsVUFNVDtDQTlCRixFQXdCVzs7Q0F4QlgsQ0FnQ007Q0FHSixFQUFZLENBQVosR0FBQSxDQUFDOztDQUFELENBQUEsQ0FDVyxDQUFYLElBQUM7O0NBREQsRUFFUyxDQUFULElBQUM7O0NBRkQsRUFJTyxDQUFQLElBQUMsQ0FBTTtDQUNMLFNBQUEsS0FBQTtDQUFBLEVBQUEsQ0FBVSxFQUFWO0NBQUEsQ0FDQSxDQUFLLEdBQUwsQ0FBYSxHQURiO0NBQUEsQ0FFQSxDQUFLLEdBQUwsRUFBYSxFQUZiO0NBQUEsQ0FHQSxDQUFLLEdBQUwsQ0FBWSxHQUhaO0NBREssQ0FNTCxDQUFFLFVBQUY7Q0FWRixJQUlPOztDQUpQLEVBWVEsQ0FBUixDQUFBLEdBQUMsQ0FBUTtDQUNQLFNBQUEsV0FBQTtDQUFBLEdBQW1CLEVBQW5CLEtBQUE7Q0FBQSxHQUFBLFdBQU87UUFBUDtDQUFBLENBQUEsQ0FFTyxDQUFQLEVBQUE7Q0FGQSxFQUlBLEdBQUE7Q0FBTSxDQUFPLEdBQVAsR0FBQTtBQUFnQixDQUFoQixDQUFlLENBQUwsS0FBQTtDQUFWLENBQTJCLENBQUEsR0FBUixFQUFBLENBQVE7Q0FBSSxFQUFELENBQUMsYUFBRDtDQUE5QixRQUEyQjtDQUpqQyxPQUFBO0FBTW1CLENBQW5CLENBQWlDLENBQWQsQ0FBSixFQUFmLEVBQW1CO0NBQW5CLEdBQUEsV0FBTztRQU5QO0NBQUEsQ0FPOEMsQ0FBL0IsQ0FBWCxDQUFvQixDQUF4QixDQUFBLENBQWU7Q0FDZixHQUFlLENBQUEsQ0FBZixDQUFlO0NBQWYsR0FBQSxXQUFPO1FBUlA7QUFVbUIsQ0FBbkIsQ0FBaUMsQ0FBZCxDQUFKLEVBQWYsRUFBbUI7Q0FBbkIsR0FBQSxXQUFPO1FBVlA7Q0FBQSxDQVcyQyxDQUEvQixDQUFSLENBQWlCLENBQXJCLEVBQVk7Q0FDWixHQUFlLENBQUEsQ0FBZjtDQUFBLEdBQUEsV0FBTztRQVpQO0FBY21CLENBQW5CLENBQWlDLENBQWQsQ0FBSixFQUFmLEVBQW1CO0NBQW5CLEdBQUEsV0FBTztRQWRQO0NBQUEsQ0FlMkMsQ0FBL0IsQ0FBUixDQUFpQixDQUFyQixFQUFZO0NBQ1osR0FBZSxDQUFBLENBQWY7Q0FBQSxHQUFBLFdBQU87UUFoQlA7QUFrQm1CLENBQW5CLENBQWlDLENBQWQsQ0FBSixFQUFmLEVBQW1CO0NBQW5CLEdBQUEsV0FBTztRQWxCUDtDQUFBLENBbUJzQyxDQUF0QixDQUFaLENBQVksQ0FBaEIsRUFBQTtBQUNtQixDQUFuQixHQUFlLEVBQWYsRUFBZ0M7Q0FBaEMsR0FBQSxXQUFPO1FBcEJQO0FBc0JtQixDQUFuQixDQUFpQyxDQUFkLENBQUosRUFBZixFQUFtQjtDQUFuQixHQUFBLFdBQU87UUF0QlA7Q0FBQSxDQXVCa0MsQ0FBdEIsQ0FBUixDQUFRLENBQVo7QUFDbUIsQ0FBbkIsR0FBZSxFQUFmO0NBQUEsR0FBQSxXQUFPO1FBeEJQO0NBQUEsQ0EyQmMsQ0FBZCxHQUFBLEVBQUE7QUFDNkIsQ0E1QjdCLEVBNEJhLEVBQWUsQ0FBNUIsSUFBQTtDQTVCQSxDQTZCOEMsQ0FBL0IsQ0FBWCxDQUFvQixDQUF4QixDQUFBLENBQWUsRUFBUztDQUN4QixHQUFlLENBQUEsQ0FBZixDQUFlO0NBQWYsR0FBQSxXQUFPO1FBOUJQO0NBRE0sWUFpQ047Q0E3Q0YsSUFZUTs7Q0FaUixFQStDVSxDQUFWLENBQVUsRUFBVixDQUFDLENBQVU7Q0FDVCxRQUFBLENBQUE7Q0FBQSxDQUFBLENBQUEsR0FBQTtDQUVBLEdBQWtCLEVBQWxCLGVBQUE7Q0FBQSxFQUFBLFlBQU87UUFGUDtDQUFBLENBR08sQ0FBUCxDQUFPLENBQU8sQ0FBZCxDQUFPO0NBRVAsR0FBa0IsRUFBbEIsWUFBQTtDQUFBLEVBQUEsWUFBTztRQUxQO0NBQUEsQ0FNTyxDQUFQLENBQU8sQ0FBTyxDQUFkO0NBRUEsR0FBa0IsRUFBbEIsWUFBQTtDQUFBLEVBQUEsWUFBTztRQVJQO0NBQUEsRUFTTyxDQUFQLENBQXVCLENBQXZCLElBQU87Q0FDUCxHQUFrQixFQUFsQixNQUFBO0NBQUEsRUFBQSxZQUFPO1FBVlA7Q0FBQSxDQVdPLENBQVAsQ0FBTyxFQUFQO0NBRUEsR0FBa0IsRUFBbEIsZ0JBQUE7Q0FBQSxFQUFBLFlBQU87UUFiUDtDQUFBLENBY08sQ0FBUCxDQUFPLENBQU8sQ0FBZCxFQUFPO0NBRVAsR0FBa0IsRUFBbEIsWUFBQTtDQUFBLEVBQUEsWUFBTztRQWhCUDtDQUFBLEVBaUJBLENBQU8sQ0FBSyxDQUFaO0NBRUEsR0FBa0IsRUFBbEIsZUFBQTtDQUFBLEVBQUEsWUFBTztRQW5CUDtDQUFBLEVBb0JBLENBQVEsQ0FBTyxDQUFmLENBcEJBO0NBRFEsWUF1QlI7Q0F0RUYsSUErQ1U7O0NBMkJHLENBQVMsQ0FBVCxDQUFBLENBQUEsQ0FBQSxJQUFBLFFBQUU7Q0FDYixTQUFBLGtCQUFBO0NBQUEsRUFEYSxDQUFBLENBQ2IsQ0FEWTtDQUNaLEVBQXVDLENBQVQsQ0FBQSxDQUE5QixFQUErQztDQUEvQyxFQUFTLENBQVIsQ0FBRCxHQUFBO1FBQUE7Q0FBQSxDQUFBLENBQ1ksQ0FBWCxFQUFELEVBQUE7Q0FEQSxDQUFBLENBRVUsQ0FBVCxFQUFEO0NBRkEsR0FHQyxFQUFELEtBQUE7Q0FFQTs7Ozs7Ozs7Q0FMQTtDQWNBLEdBQU8sRUFBUCwwQ0FBQTtDQUVFLEVBQU8sQ0FBUCxJQUFBLE1BQUE7SUFDTSxFQUhSLEVBQUEsWUFBQSw4QkFHUTtDQUVOLEVBQU8sQ0FBUCxJQUFBLEtBQUE7TUFMRixFQUFBO0NBUUUsRUFBTyxDQUFQLElBQUEsU0FBQTtRQXRCRjtDQXdCQSxHQUFHLEVBQUgsWUFBQTtDQUNFLENBQWtDLENBQXJCLENBQUksSUFBakIsRUFBQSxLQUFhO01BRGYsRUFBQTtDQUdFLEVBQWEsQ0FBSSxJQUFqQixFQUFBLFNBQUE7UUEzQkY7QUE2QmMsQ0FBZCxHQUFBLEVBQUEsSUFBQTtDQUFBLGFBQUE7UUE3QkE7Q0FBQSxFQStCQSxHQUFBLENBQU8sQ0FBTSxFQUFBO0NBL0JiLEVBaUNZLEdBQVosR0FBQTtDQUVFLEdBQUMsSUFBRDtDQUNBLEdBQUcsSUFBSCxNQUFBO0NBQ0ssQ0FBRCxFQUFGLEVBQUEsV0FBQTtNQURGLElBQUE7Q0FHSyxDQUFILElBQUEsV0FBQTtVQU5RO0NBakNaLE1BaUNZO0NBakNaLEdBeUNDLEVBQUQsRUFBQTs7QUFDRSxDQUFBO0dBQUEsV0FBVywwRkFBWDtDQUNFLENBQXdCLENBQVgsQ0FBQSxFQUFiLEdBQWEsQ0FBYjtDQUFBO0NBREY7O0NBMUNGO0NBM0VGLElBMEVhOztDQTFFYixFQStIYSxNQUFBLEVBQWI7Q0FBaUIsRUFBUyxDQUFULEVBQUQsT0FBQTtDQUFVLENBQU8sR0FBUCxHQUFBO0FBQWdCLENBQWhCLENBQWUsQ0FBTCxLQUFBO0NBQXZCO0NBL0hiLElBK0hhOztDQS9IYixFQWdJVyxDQUFBLEtBQVg7Q0FBcUIsU0FBQSxzQkFBQTtDQUFBO0NBQUE7WUFBQSwrQkFBQTsyQkFBQTtDQUFBLEdBQUEsRUFBTSxFQUFOO0NBQUE7dUJBQVY7Q0FoSVgsSUFnSVc7O0NBaElYLEVBb0lNLENBQU4sS0FBTTtDQUFHLFNBQUEsc0JBQUE7Q0FBQTtDQUFBO1lBQUEsK0JBQUE7MkJBQUE7Q0FBQSxHQUFBLEVBQU07Q0FBTjt1QkFBSDtDQXBJTixJQW9JTTs7Q0FwSU4sRUFzSVUsS0FBVixDQUFXO0NBQ1QsU0FBQSxDQUFBO0NBQUEsR0FBQyxFQUFELEtBQUE7Q0FBQSxFQUdFLEVBREYsQ0FBQTtDQUNFLENBQVMsS0FBVCxDQUFBO0NBQUEsQ0FDTSxFQUFOLENBREEsR0FDQTtDQURBLENBRU0sRUFBTixJQUFBO0NBRkEsQ0FHVSxNQUFWO0NBSEEsQ0FJTSxFQUFOLEVBQU0sRUFBTjtDQVBGLE9BQUE7Q0FBQSxFQVVFLENBREYsRUFBQTtDQUNFLENBQVcsR0FBQSxFQUFBLENBQVgsQ0FBQTtDQUFBLENBQ1MsS0FBVCxDQUFBO0NBREEsQ0FFTSxFQUFOLENBQVcsR0FBWDtDQVpGLE9BQUE7Q0FjQyxHQUFBLEtBQUQsSUFBQTtDQXJKRixJQXNJVTs7Q0F0SVYsRUF1SlUsS0FBVixDQUFXO0NBQ1QsUUFBQSxDQUFBO0NBQUEsR0FBb0IsRUFBcEIsS0FBQTtDQUFBLElBQUEsVUFBTztRQUFQO0NBQ0EsR0FBb0IsRUFBcEIsWUFBQTtDQUFBLElBQUEsVUFBTztRQURQO0NBQUEsRUFHTyxDQUFQLENBQU8sQ0FBUCxFQUFlO0NBRWYsR0FBb0IsRUFBcEIsTUFBQTtDQUFBLElBQUEsVUFBTztRQUxQO0NBTUEsRUFBNEIsQ0FBWixDQUFoQixDQUFBO0NBQUEsSUFBQSxVQUFPO1FBTlA7Q0FPQSxFQUE0QixDQUFaLEVBQWhCLEVBQW9DO0NBQXBDLElBQUEsVUFBTztRQVBQO0NBU0EsR0FBZ0IsQ0FBa0IsQ0FBbEMsQ0FBZ0IsQ0FBMEI7Q0FBMUMsSUFBQSxVQUFPO1FBVFA7Q0FBQSxFQVdBLENBQU0sRUFBTixFQUFjO0NBQ2QsRUFBNEIsQ0FBWixFQUFoQjtDQUFBLElBQUEsVUFBTztRQVpQO0NBY0ssRUFBVSxDQUFYLElBQW1CLENBQXZCLElBQUE7Q0F0S0YsSUF1SlU7O0NBdkpWOztDQW5DRjs7Q0FBQSxDQTZNQSxDQUFpQixHQUFYLENBQU4sQ0E3TUE7Q0FBQTs7Ozs7QUNBQTtDQUFBLENBQUEsVUFBQTtDQUFBLEtBQUEsb0VBQUE7S0FBQSx3QkFBQTs7Q0FBQSxDQUVBLENBQU8sQ0FBUCxLQUFRO0NBQ04sQ0FBMEIsQ0FBUixDQUFMLENBQVksTUFBbEI7Q0FIVCxFQUVPOztDQUZQLENBS0EsQ0FBVyxLQUFYLENBQVk7Q0FDVixPQUFBLEdBQUE7Q0FBQSxDQUFBLENBQUksQ0FBSjtBQUVBLENBQUEsRUFBQSxNQUFTLG9CQUFUO0NBQ0UsRUFBSSxFQUFPLENBQVg7Q0FBQSxDQUNLLEVBQUEsRUFBTCxFQUFLO0NBRlAsSUFGQTtDQURTLFVBT1Q7Q0FaRixFQUtXOztDQUxYLENBY0EsQ0FBSSxNQUFDO0NBQ0gsV0FBTztDQUFQLFVBQ087QUFBbUIsQ0FBWCxFQUFJLFlBQUw7Q0FEZCxVQUVPO0NBQU8sRUFBSSxZQUFKO0NBRmQsVUFHTztDQUFRLEVBQUksWUFBTDtDQUhkLFVBSU87Q0FBTyxFQUFJLFlBQUo7Q0FKZCxJQURFO0NBZEosRUFjSTs7Q0FkSixDQXFCQSxDQUFZLE1BQVo7Q0FFRSxPQUFBLCtHQUFBO0NBQUEsQ0FFRSxDQUZFLENBQUosTUFBSTtDQUFKLEVBVUEsQ0FBQSxFQUFhLE1BQU47Q0FWUCxFQWVJLENBQUosRUFBSTtDQWZKLENBa0JJLENBQUEsQ0FBSjtDQWxCQSxDQUFBLENBb0JJLENBQUo7QUFFQSxDQUFBLEVBQUEsTUFBUyxpRkFBVDtDQUNFLENBQUEsQ0FBTyxHQUFQO0FBRUEsQ0FBQSxFQUFBLFFBQVMsbUJBQVQ7Q0FFRSxDQUEwQixDQUFoQixDQUF1QyxJQUFqRCxFQUFXO0NBRmIsTUFIRjtDQUFBLElBdEJBO0NBQUEsRUFzQ29CLENBQXBCLE1BdENBLE9Bc0NBO0NBdENBLENBdUNTLENBQUgsQ0FBTixFQUFpQixXQXZDakI7Q0FBQSxDQXdDUyxDQUFILENBQU4sQ0FBZTtDQXhDZixDQXlDUyxDQUFILENBQU4sRUFBaUIsSUF6Q2pCO0NBQUEsQ0E0Q0EsQ0FBSyxDQUFMLE1BNUNBO0NBQUEsQ0E2Q0EsQ0FBSyxDQUFMLE1BN0NBO0NBQUEsQ0E4Q0EsQ0FBSyxDQUFMLE1BOUNBO0NBQUEsQ0ErQ0EsQ0FBSyxDQUFMLE1BL0NBO0NBQUEsQ0FnREEsQ0FBSyxDQUFMLE1BaERBO0NBQUEsQ0FBQSxDQW9ESSxDQUFKO0FBRUEsQ0FBQSxFQUFBLE1BQVMsc0ZBQVQ7QUFFRSxDQUFBLEVBQUEsUUFBd0IsbUJBQXhCO0NBQUEsRUFBTyxLQUFQO0NBQUEsTUFBQTtBQUVBLENBQUEsRUFBQSxRQUFTLG9CQUFUO0NBQ0UsQ0FBb0MsQ0FBN0IsQ0FBQSxJQUFQO0NBREYsTUFGQTtDQUFBLENBQUEsQ0FPSSxHQUFKO0NBUEEsQ0FBQSxDQVFJLEdBQUo7Q0FSQSxDQUFBLENBU0ksR0FBSjtDQVRBLENBQUEsQ0FVSSxHQUFKO0NBVkEsQ0FBQSxDQVdJLEdBQUo7QUFHQSxDQUFBLEVBQUEsUUFBUyxtQkFBVDtDQUNFLENBQUksQ0FBQSxDQUFJLENBQUosR0FBSjtDQUFBLENBQ2EsQ0FBVCxDQUFDLElBQUwsRUFEQTtDQUFBLEVBRUksS0FBSjtDQUZBLEVBR0ksS0FBSjtDQUhBLENBSVksQ0FBUixDQUFBLElBQUo7Q0FKQSxFQUtJLEtBQUo7Q0FMQSxFQU1JLEtBQUo7Q0FQRixNQWRBO0NBQUEsQ0F3QkEsQ0FBSyxHQUFMLElBeEJBO0NBQUEsQ0F5QkEsQ0FBSyxHQUFMLElBekJBO0NBQUEsQ0EwQkEsQ0FBSyxHQUFMLElBMUJBO0NBQUEsQ0EyQkEsQ0FBSyxHQUFMLElBM0JBO0NBQUEsQ0E0QkEsQ0FBSyxHQUFMLElBNUJBO0NBRkYsSUF0REE7Q0FzRkEsQ0FBTyxDQUNBLEtBREEsR0FBQTtDQTdHVCxFQXFCWTs7Q0FyQlosQ0FtSEEsQ0FBYSxHQUFBLEdBQUMsQ0FBZDtDQUNFLE9BQUEsa0JBQUE7Q0FBQSxFQUFBLENBQUE7QUFDQSxDQUFBLEVBQUEsTUFBVyxpR0FBWDtDQUNFLENBQStCLENBQXRCLEdBQVQsRUFBUztDQUNULEdBQVMsQ0FBQSxDQUFUO0NBQUEsYUFBQTtRQURBO0NBR0EsS0FBQSxRQUFPO0NBQVAsRUFBQSxVQUNPO0NBQW9DLEVBQUEsQ0FBTyxNQUFQO0NBQXBDO0NBRFAsRUFBQSxVQUVPO0NBQW9DLEVBQU8sY0FBQTtDQUZsRCxFQUFBLFVBR087Q0FIUCxFQUFBLFVBR2U7Q0FBNEIsRUFBTyxjQUFBO0NBSGxELEVBQUEsVUFJTztDQUpQLEVBQUEsVUFJZTtDQUpmLEVBQUEsVUFJdUI7Q0FKdkIsRUFBQSxVQUkrQjtDQUFZLEVBQU8sY0FBQTtDQUpsRDtDQUtPLEVBQUEsY0FBTztDQUxkLE1BSkY7Q0FBQSxJQURBO0NBRFcsVUFhWDtDQWhJRixFQW1IYTs7Q0FuSGIsQ0FrSUEsQ0FBZ0IsQ0FBQSxLQUFDLElBQWpCO0NBQ0UsT0FBQSxNQUFBO0NBQUEsQ0FBWSxDQUFBLENBQVosR0FBQSxFQUFBO0NBQUEsRUFDQSxDQUFBLEtBQU07Q0FFTixFQUFHLENBQUgsTUFBRztDQUNELEVBQWMsQ0FBVixFQUFKLEdBQUE7Q0FDQSxHQUFBLFNBQU87TUFMVDtDQUFBLEdBT0EsR0FBQTtDQUNBLElBQUEsTUFBTztDQTNJVCxFQWtJZ0I7O0NBbEloQixDQTZJQSxDQUFvQixDQUFwQixLQUFxQjtDQUFxQixFQUFWLE1BQUEsRUFBQTtDQTdJaEMsRUE2SW9COztDQTdJcEIsQ0E4SUEsQ0FBb0IsQ0FBaEIsRUFBZ0IsR0FBcEI7Q0FBMkMsS0FBWCxJQUFBLENBQUE7Q0E5SWhDLEVBOElvQjs7Q0E5SXBCLENBK0lBLENBQW9CLENBQWhCLEtBQWlCLEdBQXJCO0NBQThDLEdBQWQsT0FBQSxFQUFBO0NBL0loQyxFQStJb0I7O0NBL0lwQixDQWlKQSxDQUNFLEdBREY7Q0FDRSxDQUFjLEVBQWQsQ0FBQSxHQUFBO0NBQUEsQ0FDYyxFQUFkLENBREEsS0FDQTtDQURBLENBRWMsRUFBZCxDQUZBLE9BRUE7Q0FwSkYsR0FBQTs7QUFzSkEsQ0FBQSxNQUFBLElBQUE7OENBQUE7Q0FBQSxDQUE0QixDQUE1QixDQUFBLEVBQU0sUUFBTjtDQUFBLEVBdEpBOztDQUFBLENBd0pBLENBQWlCLENBeEpqQixFQXdKTSxDQUFOO0NBeEpBOzs7OztBQ0FBO0NBQUEsQ0FBQSxVQUFBO0NBQUEsS0FBQSxxQkFBQTtLQUFBLHdCQUFBOztDQUFBLENBRUEsQ0FDRSxNQURGO0NBQ0UsQ0FBYyxFQUFkLENBQUEsR0FBQTtDQUFBLENBQ2MsRUFBZCxNQUFBO0NBREEsQ0FFYyxFQUFkLENBRkEsT0FFQTtDQUxGLEdBQUE7O0NBQUEsQ0FPQSxDQUNFLGFBREY7Q0FDRSxDQUFjLEVBQWQsQ0FBQSxHQUFBO0NBQUEsQ0FDYyxFQUFkLENBREEsS0FDQTtDQURBLENBRWMsRUFBZCxDQUZBLE9BRUE7Q0FWRixHQUFBOztDQUFBLENBWUEsQ0FBdUIsQ0FBQSxHQUFoQixFQUFpQixHQUF4QjtDQUNFLE9BQUEsS0FBQTtDQUFBLEdBQUEseUJBQUE7QUFDRSxDQUFBO1dBQUEsQ0FBQTtrREFBQTtBQUF5QixDQUFBLEVBQUEsQ0FBQSxDQUFjLENBQWQsRUFBQTtDQUN2QixDQUE0QixDQUE1QixDQUFBLEVBQU0sUUFBTjtDQUFpQyxDQUFZLEdBQVosS0FBQSxFQUFBO0NBQWpDLFdBQUE7VUFERjtDQUFBO3VCQURGO01BRHFCO0NBWnZCLEVBWXVCO0NBWnZCOzs7OztBQ0FBO0FBQ0E7QUFDQTs7QUNGQTtDQUFBLENBQUEsVUFBQTtDQUFBLEtBQUEscUpBQUE7S0FBQTtvU0FBQTs7Q0FBQSxDQUdBLENBQWUsSUFBQSxLQUFmLEdBQWU7O0NBSGYsQ0FJQSxDQUFlLENBQWYsR0FBZSxRQUFBOztDQUpmLENBS0EsQ0FBZSxJQUFBLEdBQWYsV0FBZTs7Q0FMZixDQU9BLENBQXNCLGdCQUF0Qjs7Q0FQQSxDQVFBLENBQXVCLGVBQXZCOztDQVJBLENBVU07Q0FDSixDQUE4QixDQUFaLENBQWxCLE1BQUMsS0FBRDs7Q0FFYSxDQUFZLENBQVosQ0FBQSxFQUFBLENBQUEsYUFBRTtDQUF5QixFQUF6QixDQUFBLEVBQUQsQ0FBMEI7Q0FBQSxFQUFmLENBQUEsRUFBRDtDQUFnQixFQUFULENBQUEsRUFBRDtDQUY5QixJQUVhOztDQUZiLEVBS08sQ0FBQSxDQUFQLElBQVE7Q0FDTixHQUFDLEVBQUQ7Q0FDQSxHQUFjLEVBQWQsYUFBQTtDQUFBLGFBQUE7UUFEQTtDQUVDLEdBQUEsRUFBRCxPQUFBO0NBUkYsSUFLTzs7Q0FMUCxFQVVRLEdBQVIsR0FBUTtDQUNOLEdBQVUsRUFBVixhQUFBO0NBQUEsYUFBQTtRQUFBO0NBQ0MsR0FBQSxHQUFELE1BQUE7Q0FaRixJQVVROztDQVZSLEVBY1csTUFBWDtDQUNFLEVBQWdCLENBQWYsQ0FBRCxDQUFBO0NBQ0MsRUFBRCxDQUFDLENBQWEsQ0FBUCxJQUFpQyxHQUF4QyxFQUFjO0NBaEJoQixJQWNXOztDQWRYLEVBa0JZLE1BQUEsQ0FBWjtDQUNFLEdBQUMsRUFBRCxHQUFBO0NBQ0MsR0FBQSxDQUFELFFBQUE7Q0FBTyxDQUFHLEtBQUgsQ0FBQTtDQUFBLENBQW1CLEVBQUMsQ0FBUixDQUFaLEVBQVk7Q0FGVCxPQUVWO0NBcEJGLElBa0JZOztDQWxCWixFQXNCWSxHQUFBLEdBQUMsQ0FBYjtDQUNFLEdBQWMsRUFBZCxRQUFBO0NBQUEsYUFBQTtRQUFBO0NBQ0MsQ0FBbUIsQ0FBaEIsQ0FBSCxFQUFELENBQUEsTUFBQTtDQXhCRixJQXNCWTs7Q0F0QlosRUEwQmEsTUFBQyxFQUFkO0NBQ0UsR0FBYyxFQUFkLGdDQUFBO0NBQUEsYUFBQTtRQUFBO0NBRUEsRUFBVSxXQUFIO0NBQVAsWUFDTyxFQURQO0NBQzZCLEdBQUEsTUFBRCxPQUFBO0NBRDVCLE9BQUEsS0FFTztDQUFlLEVBQWMsQ0FBZCxFQUFELElBQUEsT0FBQTtDQUZyQixZQUdPO0NBQTJCLENBQWMsQ0FBdEIsQ0FBQSxHQUFPLENBQVAsU0FBQTtDQUgxQixNQUhXO0NBMUJiLElBMEJhOztDQTFCYixFQWtDVSxDQUFBLElBQVYsQ0FBVztDQUFVLEdBQUEsQ0FBRCxRQUFBO0NBQU8sQ0FBRyxJQUFILEVBQUE7Q0FBQSxDQUFpQixFQUFOLElBQUE7Q0FBNUIsT0FBVTtDQWxDcEIsSUFrQ1U7O0NBbENWLEVBb0NNLENBQU4sS0FBTTtDQUNKLEdBQWMsRUFBZCxhQUFBO0NBQUEsYUFBQTtRQUFBO0NBQUEsR0FDQyxFQUFELElBQUE7QUFDQSxDQUZBLEdBRVEsRUFBUjtBQUNBLENBQUEsR0FBUSxFQUFSLE9BQUE7Q0F4Q0YsSUFvQ007O0NBcENOOztDQVhGOztDQUFBLENBcURNO0NBRUo7O0NBQUEsRUFBbUIsQ0FBbkIsVUFBQyxDQUFEOztDQUFBLEVBQ3VCLENBQXZCLFVBQUMsQ0FERCxJQUNBOztDQUVhLENBQVMsQ0FBVCxDQUFBLENBQUEsQ0FBQSxrQkFBQztDQUNaLENBQWMsR0FBZCxDQUFBLDBDQUFNO0NBQU4sR0FDQSxFQUFBLElBQVUsRUFBVjtDQUxGLElBR2E7O0NBSGIsRUFPUyxJQUFULEVBQVM7Q0FDUCxDQUFBLFFBQUE7Q0FBQSxFQUFVLENBQVQsRUFBRCxHQUE0QixHQUFOO0NBQXRCLENBQ0EsQ0FBSyxDQURMLEVBQ0E7Q0FEQSxDQUVBLENBQXNCLENBQXJCLEVBQUQsR0FBQTtDQUFtQyxDQUFELEVBQUYsT0FBQSxJQUFBO0NBQWhDLE1BQXNCO0NBRnRCLEdBR3lCLEVBQXpCLElBQVUsRUFBVjtDQUNDLEVBQVMsQ0FBVCxFQUFELEdBQVcsSUFBWDtDQUFxQixHQUFBLEVBQU0sU0FBUDtDQUxiLE1BS0c7Q0FaWixJQU9TOztDQVBULEVBY1ksTUFBQSxDQUFaO0NBQWdCLEdBQUEsRUFBTSxJQUFQLEdBQUE7Q0FkZixJQWNZOztDQWRaOztDQUY0Qjs7Q0FyRDlCLENBdUVNO0NBQ0o7O0NBQUEsRUFBdUIsQ0FBdkIsU0FBQyxFQUFEOztDQUFBLEVBQ3VCLENBQXZCLFNBQUMsTUFBRDs7Q0FFYSxDQUFTLENBQVQsQ0FBQSxDQUFBLENBQUEsaUJBQUM7Q0FDWixFQURnQyxDQUFBLEVBQUQ7Q0FDL0IsQ0FBYyxHQUFkLENBQUEseUNBQU07Q0FBTixHQUNBLEVBQUEsSUFBVSxFQUFWO0NBTEYsSUFHYTs7Q0FIYixFQU9TLElBQVQsRUFBUztDQUNQLENBQUEsUUFBQTtDQUFBLEVBQWMsQ0FBYixFQUFEO0NBQUEsQ0FDQSxDQUFLLENBREwsRUFDQTtDQURBLEVBRW9CLENBQW5CLENBQW1CLENBQXBCLEdBQUE7Q0FBa0MsQ0FBRCxFQUFGLENBQW9CLE1BQXBCLElBQUE7Q0FGL0IsTUFFb0I7Q0FGcEIsR0FHeUIsRUFBekIsSUFBVSxFQUFWO0NBQ0MsRUFBUyxDQUFULEVBQUQsR0FBVyxJQUFYO0NBQXFCLEdBQUEsRUFBTSxLQUFQLElBQUE7Q0FMYixNQUtHO0NBWlosSUFPUzs7Q0FQVCxFQWNZLE1BQUEsQ0FBWjtDQUFnQixHQUFBLEVBQU0sR0FBUCxJQUFBO0NBZGYsSUFjWTs7Q0FkWjs7Q0FEMkI7O0NBdkU3QixDQXdGTTtDQUNKLEVBQXdCLENBQXhCLFdBQUEsRUFBQzs7Q0FBRCxFQUN3QixDQUF4QixhQUFDLEVBQUQ7O0NBRWEsQ0FBWSxDQUFaLENBQUEsR0FBQSxvQkFBRTtDQUNiLEVBRGEsQ0FBQSxFQUFELENBQ1o7Q0FBQSxFQUR1QixDQUFBLEVBQUQ7Q0FDdEIsR0FBQSxFQUFBLElBQVUsRUFBVjtDQUpGLElBR2E7O0NBSGIsRUFNVSxFQUFBLEdBQVYsQ0FBWTtDQUNWLEVBRFUsQ0FBQSxDQUNWLENBRFM7QUFDVCxDQUFBLEdBQVEsRUFBUixHQUFBO0NBQ0MsR0FBQSxDQUFELFFBQUE7Q0FSRixJQU1VOztDQU5WLEVBVU8sRUFBUCxJQUFPO0NBQ0wsU0FBQSxHQUFBO0NBQUEsRUFBZ0IsQ0FBQSxFQUFoQixHQUFBO0FBRUEsQ0FBQSxFQUNvQixDQURDLEtBQ2QsSUFEUCxNQUNNLEtBREEsR0FBQTtDQUVKLEdBQUksQ0FBSixHQUFBLElBQUE7Q0FKRixNQUVBO0NBSUEsR0FBRyxFQUFILGdCQUFBO0NBQUE7SUFFUSxFQUZSLEVBQUEsaUJBQUE7Q0FHRyxDQUFtQixDQUFoQixDQUFILENBQXlCLENBQTFCLENBQUEsUUFBQTtNQUhGLEVBQUE7Q0FLRSxDQUFBLENBQUssQ0FBTCxJQUFBO0NBQ1csRUFBRSxNQUFBLENBQWIsS0FBQTtDQUFtQixDQUFELEdBQUYsWUFBQTtDQUFMLENBQWtCLE9BQWhCLFNBQWI7UUFiRztDQVZQLElBVU87O0NBVlAsRUF5Qk0sQ0FBTixLQUFNO0NBQUksRUFBWSxDQUFaLEtBQUQsSUFBQTtDQXpCVCxJQXlCTTs7Q0F6Qk47O0NBekZGOztDQW9IQTtDQUFBLE1BQUEsb0NBQUE7cUJBQUE7Q0FBQSxHQUFBLE1BQVUsRUFBVjtDQUFBLEVBcEhBOztDQUFBLENBK0hBLENBQTRCLElBQXJCLE9BQVA7O0NBL0hBLENBZ0lBLENBQTRCLElBQXJCLE1BQVA7O0NBaElBLENBaUlBLENBQTRCLElBQXJCLFVBQVA7Q0FqSUEiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIlxud2luZG93Lkhhc2hDYXNoID0gcmVxdWlyZSBcIi4vaGFzaGNhc2guY29mZmVlXCJcbiIsIlwidXNlIHN0cmljdFwiXG5cbiMjIHdlIHVzZSBvdXIgb3duIHNoYTEgaW5zdGVhZCBvZiBjcnlwdG8gZm9yIGEgbW9yZSBsZWFuIGJyb3dzZXJcbiMjIGltcGxlbWVudGF0aW9uIHdpdGggYnJvd3NlcmlmeVxuc2hhMSAgICAgICA9IHJlcXVpcmUgXCIuL3NoYTEuY29mZmVlXCJcbnRhc2ttYXN0ZXIgPSByZXF1aXJlIFwiLi90YXNrbWFzdGVyLmNvZmZlZVwiXG5wcm9wZXJ0aWVzID0gcmVxdWlyZSBcIi4vcHJvcGVydGllcy5jb2ZmZWVcIlxuXG5Ob2RlVGFza01hc3RlciAgICA9IHRhc2ttYXN0ZXIuTm9kZVRhc2tNYXN0ZXJcbldlYlRhc2tNYXN0ZXIgICAgID0gdGFza21hc3Rlci5XZWJUYXNrTWFzdGVyXG5UaW1lb3V0VGFza01hc3RlciA9IHRhc2ttYXN0ZXIuVGltZW91dFRhc2tNYXN0ZXJcblxuIyMgaGFzaGNhc2ggZm9ybWF0OlxuIyMgdmVyOmJpdHM6ZGF0ZTpyZXNvdXJjZTpyYW5kOmNvdW50ZXJcblxuX2J1aWxkRGF0ZSA9IChkYXRlKSAtPlxuICBpZiB0eXBlb2YoZGF0ZSkgaXMgXCJzdHJpbmdcIlxuICAgIHJldHVybiBudWxsIGlmIGRhdGUubGVuZ3RoIGlzbnQgNlxuICAgIHJldHVybiBkYXRlXG5cbiAgcmV0dXJuIG51bGwgaWYgdHlwZW9mKGRhdGUpIGlzbnQgXCJudW1iZXJcIlxuXG4gIHJldHVybiBfYnVpbGREYXRlIFwiI3tkYXRlfVwiXG5cbl9uZXh0UG9zID0gKHN0ciwgcG9zKSAtPlxuICBwb3Muc3RhcnQgPSBwb3MuZW5kICsgMVxuICByZXR1cm4gZmFsc2UgaWYgcG9zLnN0YXJ0IGlzIHN0ci5sZW5ndGhcbiAgcG9zLmVuZCA9IHN0ci5pbmRleE9mICc6JywgcG9zLnN0YXJ0XG4gIHJldHVybiBmYWxzZSBpZiBwb3MuZW5kIGlzIC0xXG4gIHJldHVybiBmYWxzZSBpZiBwb3MuZW5kIGlzIHBvcy5zdGFydFxuICB0cnVlXG5cbmNsYXNzIEhhc2hDYXNoXG4gICMjIFNUQVRJQ1xuXG4gIEBWRVJTSU9OOiAgIDFcbiAgQE1JTl9CSVRTOiAxNlxuICBAaGFzaDogICBzaGExXG5cbiAgQGRhdGU6IC0+XG4gICAgbm93ID0gbmV3IERhdGUoKVxuICAgIHl5ID0gKFwiMFwiICsgKG5vdy5nZXRZZWFyKCkgLSAxMDApKVstMi4uXVxuICAgIG1tID0gKCcwJyArIChub3cuZ2V0TW9udGgoKSArIDEpKVstMi4uXVxuICAgIGRkID0gKCcwJyArIG5vdy5nZXREYXRlKCkpWy0yLi5dXG5cbiAgICBcIiN7eXl9I3ttbX0je2RkfVwiXG5cbiAgQHBhcnNlOiAoc3RyKSAtPlxuICAgIHJldHVybiBudWxsIGlmIG5vdCBzdHI/XG5cbiAgICBkYXRhID0ge31cblxuICAgIHBvcyA9IHN0YXJ0OiAwLCBlbmQ6IC0xLCBsZW5ndGg6IC0+IEBlbmQgLSBAc3RhcnRcblxuICAgIHJldHVybiBudWxsIGlmIG5vdCBfbmV4dFBvcyBzdHIsIHBvc1xuICAgIGRhdGEudmVyc2lvbiA9IHBhcnNlSW50IHN0ci5zdWJzdHIocG9zLnN0YXJ0LCBwb3MubGVuZ3RoKCkpLCAxMFxuICAgIHJldHVybiBudWxsIGlmIGlzTmFOIGRhdGEudmVyc2lvblxuXG4gICAgcmV0dXJuIG51bGwgaWYgbm90IF9uZXh0UG9zIHN0ciwgcG9zXG4gICAgZGF0YS5iaXRzID0gcGFyc2VJbnQgc3RyLnN1YnN0cihwb3Muc3RhcnQsIHBvcy5sZW5ndGgoKSksIDEwXG4gICAgcmV0dXJuIG51bGwgaWYgaXNOYU4gZGF0YS5iaXRzXG5cbiAgICByZXR1cm4gbnVsbCBpZiBub3QgX25leHRQb3Mgc3RyLCBwb3NcbiAgICBkYXRhLmRhdGUgPSBwYXJzZUludCBzdHIuc3Vic3RyKHBvcy5zdGFydCwgcG9zLmxlbmd0aCgpKSwgMTBcbiAgICByZXR1cm4gbnVsbCBpZiBpc05hTiBkYXRhLmRhdGVcblxuICAgIHJldHVybiBudWxsIGlmIG5vdCBfbmV4dFBvcyBzdHIsIHBvc1xuICAgIGRhdGEucmVzb3VyY2UgPSBzdHIuc3Vic3RyIHBvcy5zdGFydCwgcG9zLmxlbmd0aCgpXG4gICAgcmV0dXJuIG51bGwgaWYgbm90IGRhdGEucmVzb3VyY2UubGVuZ3RoXG5cbiAgICByZXR1cm4gbnVsbCBpZiBub3QgX25leHRQb3Mgc3RyLCBwb3NcbiAgICBkYXRhLnJhbmQgPSBzdHIuc3Vic3RyIHBvcy5zdGFydCwgcG9zLmxlbmd0aCgpXG4gICAgcmV0dXJuIG51bGwgaWYgbm90IGRhdGEucmFuZC5sZW5ndGhcblxuICAgICMjIGFsbG93IC0xIGZvciBwb3MuZW5kIGFzIGl0J3MgdGhlIGxhc3QgZmllbGRcbiAgICBfbmV4dFBvcyBzdHIsIHBvc1xuICAgIGNvdW50ZXJFbmQgPSAoaWYgcG9zLmVuZCBpcyAtMSB0aGVuIHN0ci5sZW5ndGggZWxzZSBwb3MuZW5kKSAtIHBvcy5zdGFydFxuICAgIGRhdGEuY291bnRlciA9IHBhcnNlSW50IHN0ci5zdWJzdHIocG9zLnN0YXJ0LCBjb3VudGVyRW5kKSwgMTBcbiAgICByZXR1cm4gbnVsbCBpZiBpc05hTiBkYXRhLmNvdW50ZXJcblxuICAgIGRhdGFcblxuICBAdW5wYXJzZTogKHBhcnRzKSAtPlxuICAgIHJldCA9IFwiXCJcblxuICAgIHJldHVybiByZXQgaWYgbm90IHBhcnRzLnZlcnNpb24/XG4gICAgcmV0ICs9IFwiI3twYXJ0cy52ZXJzaW9ufTpcIlxuXG4gICAgcmV0dXJuIHJldCBpZiBub3QgcGFydHMuYml0cz9cbiAgICByZXQgKz0gXCIje3BhcnRzLmJpdHN9OlwiXG5cbiAgICByZXR1cm4gcmV0IGlmIG5vdCBwYXJ0cy5kYXRlP1xuICAgIGRhdGUgPSBfYnVpbGREYXRlIHBhcnRzLmRhdGVcbiAgICByZXR1cm4gcmV0IGlmIG5vdCBkYXRlP1xuICAgIHJldCArPSBcIiN7ZGF0ZX06XCJcblxuICAgIHJldHVybiByZXQgaWYgbm90IHBhcnRzLnJlc291cmNlP1xuICAgIHJldCArPSBcIiN7cGFydHMucmVzb3VyY2V9OlwiXG5cbiAgICByZXR1cm4gcmV0IGlmIG5vdCBwYXJ0cy5yYW5kP1xuICAgIHJldCArPSBwYXJ0cy5yYW5kXG5cbiAgICByZXR1cm4gcmV0IGlmIG5vdCBwYXJ0cy5jb3VudGVyP1xuICAgIHJldCArPSBcIjoje3BhcnRzLmNvdW50ZXJ9XCJcblxuICAgIHJldFxuXG4gICMjIElOU1RBTkNFXG5cbiAgY29uc3RydWN0b3I6IChAX2JpdHMsIGNiLCBjYWxsZXIsIHdvcmtlckZpbGUsIG51bVdvcmtlcnMpIC0+XG4gICAgQF9iaXRzID0gSGFzaENhc2guTUlOX0JJVFMgaWYgQF9iaXRzIDwgSGFzaENhc2guTUlOX0JJVFNcbiAgICBAX3dvcmtlcnMgPSBbXVxuICAgIEBfcmFuZ2UgPSB7fVxuICAgIEBfcmVzZXRSYW5nZSgpXG5cbiAgICAjIyNcbiAgICBVc2UgZGlmZmVyZW50IHN0cmF0ZWdpZXMgdG8gZW5zdXJlIHRoZSBtYWluIGphdmFzY3JpcHQgdGhyZWFkIGlzIG5vdFxuICAgIGh1bmcgdXAgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaGFzaGNhc2hcblxuICAgIDEuIFVuZGVyIE5vZGUsIHdlIHVzZSBjaGlsZF9wcm9jZXNzXG4gICAgMi4gSW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IGl0LCB1c2Ugd2ViIHdvcmtlcnNcbiAgICAzLiBJbiBvdGhlciBicm93c2VycywgdXNlIHNldFRpbWVvdXRcbiAgICAjIyNcblxuICAgIGlmIG5vdCB3aW5kb3c/XG4gICAgICAjIyBydW5uaW5nIHVuZGVyIG5vZGVcbiAgICAgIHR5cGUgPSBOb2RlVGFza01hc3RlclxuICAgIGVsc2UgaWYgV29ya2VyPyBhbmQgd29ya2VyRmlsZT9cbiAgICAgICMjIGJyb3dzZXIgd2l0aCB3ZWIgd29ya2Vyc1xuICAgICAgdHlwZSA9IFdlYlRhc2tNYXN0ZXJcbiAgICBlbHNlXG4gICAgICAjIyBvdGhlciBicm93c2VyXG4gICAgICB0eXBlID0gVGltZW91dFRhc2tNYXN0ZXJcblxuICAgIGlmIG51bVdvcmtlcnM/XG4gICAgICBudW1Xb3JrZXJzID0gTWF0aC5taW4gbnVtV29ya2VycywgdHlwZS5NQVhfTlVNX1dPUktFUlNcbiAgICBlbHNlXG4gICAgICBudW1Xb3JrZXJzID0gdHlwZS5ERUZBVUxUX05VTV9XT1JLRVJTXG5cbiAgICByZXR1cm4gdW5sZXNzIG51bVdvcmtlcnNcblxuICAgIGNvbnNvbGUubG9nIFwidXNpbmcgI3tudW1Xb3JrZXJzfSB3b3JrZXJzXCJcblxuICAgIHdyYXBwZWRDYiA9IChyZXN1bHQpIC0+XG4gICAgICAjIyBwcmV2ZW50IHJhY2VzIHdoZXJlIG11bHRpcGxlIHdvcmtlcnMgcmV0dXJuZWQgYSByZXN1bHRcbiAgICAgIEBzdG9wKClcbiAgICAgIGlmIGNhbGxlcj9cbiAgICAgICAgY2IuY2FsbCBjYWxsZXIsIHJlc3VsdFxuICAgICAgZWxzZVxuICAgICAgICBjYiByZXN1bHRcblxuICAgIEBfd29ya2VycyA9IChcbiAgICAgIGZvciBudW0gaW4gWyAxIC4uIG51bVdvcmtlcnMgXVxuICAgICAgICB3b3JrZXIgPSBuZXcgdHlwZSB0aGlzLCB3cmFwcGVkQ2IsIEBfcmFuZ2UsIHdvcmtlckZpbGVcbiAgICAgICAgI3Byb3BlcnRpZXMubWFrZVJlYWRPbmx5IHdvcmtlclxuICAgICAgICB3b3JrZXJcbiAgICApXG5cbiAgICAjcHJvcGVydGllcy5tYWtlUmVhZE9ubHkgdHlwZSBmb3IgdHlwZSBpbiBbIEBfd29ya2VycywgdGhpcyBdXG5cbiAgIyMgUFJJVkFURVxuXG4gIF9yZXNldFJhbmdlOiAtPiBAX3JhbmdlID0gYmVnaW46IDAsIGVuZDogLTFcbiAgX3NlbmREYXRhOiAoZGF0YSkgLT4gd29ya2VyLnNlbmREYXRhIGRhdGEgZm9yIHdvcmtlciBpbiBAX3dvcmtlcnNcblxuICAjIyBQVUJMSUNcblxuICBzdG9wOiAtPiB3b3JrZXIuc3RvcCgpIGZvciB3b3JrZXIgaW4gQF93b3JrZXJzXG5cbiAgZ2VuZXJhdGU6IChyZXNvdXJjZSkgLT5cbiAgICBAX3Jlc2V0UmFuZ2UoKVxuXG4gICAgcGFydHMgPVxuICAgICAgdmVyc2lvbjogSGFzaENhc2guVkVSU0lPTlxuICAgICAgYml0czogQF9iaXRzXG4gICAgICBkYXRlOiBIYXNoQ2FzaC5kYXRlKClcbiAgICAgIHJlc291cmNlOiByZXNvdXJjZVxuICAgICAgcmFuZDogTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyIDJcblxuICAgIGRhdGEgPVxuICAgICAgY2hhbGxlbmdlOiBIYXNoQ2FzaC51bnBhcnNlIHBhcnRzXG4gICAgICBjb3VudGVyOiAwXG4gICAgICBiaXRzOiBwYXJ0cy5iaXRzXG5cbiAgICBAX3NlbmREYXRhIGRhdGFcblxuICB2YWxpZGF0ZTogKHN0cikgLT5cbiAgICByZXR1cm4gZmFsc2UgaWYgbm90IHN0cj9cbiAgICByZXR1cm4gZmFsc2UgaWYgbm90IEBfYml0cz9cblxuICAgIGRhdGEgPSBIYXNoQ2FzaC5wYXJzZSBzdHJcblxuICAgIHJldHVybiBmYWxzZSBpZiBub3QgZGF0YT9cbiAgICByZXR1cm4gZmFsc2UgaWYgZGF0YS5iaXRzIDwgQF9iaXRzXG4gICAgcmV0dXJuIGZhbHNlIGlmIGRhdGEuYml0cyA8IEhhc2hDYXNoLk1JTl9CSVRTXG5cbiAgICByZXR1cm4gZmFsc2UgaWYgZGF0YS52ZXJzaW9uIGlzbnQgSGFzaENhc2guVkVSU0lPTlxuXG4gICAgbm93ID0gSGFzaENhc2guZGF0ZSgpXG4gICAgcmV0dXJuIGZhbHNlIGlmIGRhdGEuZGF0ZSA8IG5vdyAtIDEgb3IgZGF0YS5kYXRlID4gbm93ICsgMVxuXG4gICAgc2hhMS5sZWFkaW5nMHMoSGFzaENhc2guaGFzaChzdHIpKSA+PSBkYXRhLmJpdHNcblxuI3Byb3BlcnRpZXMubWFrZVJlYWRPbmx5IHR5cGUgZm9yIHR5cGUgaW4gWyBIYXNoQ2FzaCwgSGFzaENhc2g6OiBdXG5cbm1vZHVsZS5leHBvcnRzID0gSGFzaENhc2hcbiIsIlwidXNlIHN0cmljdFwiXG5cblJPVEwgPSAoeCwgbikgLT5cbiAgcmV0dXJuICh4IDw8IG4pIHwgKHggPj4+ICgzMiAtIG4pKVxuXG50b0hleFN0ciA9IChuKSAtPlxuICBzID0gXCJcIlxuXG4gIGZvciBpIGluIFsgNyAuLiAwIF1cbiAgICB2ID0gKG4gPj4+IChpICogNCkpICYgMHhmXG4gICAgcyArPSB2LnRvU3RyaW5nIDE2XG5cbiAgc1xuXG5mID0gKHMsIHgsIHksIHopIC0+XG4gIHN3aXRjaCBzXG4gICAgd2hlbiAwIHRoZW4gKHggJiB5KSBeICh+eCAmIHopICAgICAgICAgICAjIyBDaCgpXG4gICAgd2hlbiAxIHRoZW4geCBeIHkgXiB6ICAgICAgICAgICAgICAgICAgICAjIyBQYXJpdHkoKVxuICAgIHdoZW4gMiB0aGVuICh4ICYgeSkgXiAoeCAmIHopIF4gKHkgJiB6KSAgIyMgTWFqKClcbiAgICB3aGVuIDMgdGhlbiB4IF4geSBeIHogICAgICAgICAgICAgICAgICAgICMjIFBhcml0eSgpXG5cbl9zaGExaGFzaCA9IChtc2cpIC0+XG4gICMjIGNvbnN0YW50cyBbNC4yLjFdXG4gIEsgPSBbXG4gICAgMHg1YTgyNzk5OVxuICAgIDB4NmVkOWViYTFcbiAgICAweDhmMWJiY2RjXG4gICAgMHhjYTYyYzFkNlxuICBdXG5cbiAgIyMgUFJFUFJPQ0VTU0lOR1xuXG4gICMjIGFkZCB0cmFpbGluZyAnMScgYml0ICgrIDAncyBwYWRkaW5nKSB0byBzdHJpbmcgWzUuMS4xXVxuICBtc2cgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSAweDgwXG5cbiAgIyMgY29udmVydCBzdHJpbmcgbXNnIGludG8gNTEyLWJpdCAvIDE2LWludGVnZXIgYmxvY2tzIGFycmF5cyBvZiBpbnRzIFs1LjIuMV1cblxuICAjIyBsZW5ndGggKGluIDMyLWJpdCBpbnRlZ2Vycykgb2YgbXNnICsgMSArIGFwcGVuZGVkIGxlbmd0aFxuICBsID0gbXNnLmxlbmd0aCAvIDQgKyAyXG5cbiAgIyMgbnVtYmVyIG9mIDE2LWludGVnZXItYmxvY2tzIHJlcXVpcmVkIHRvIGhvbGQgJ2wnIGludHNcbiAgTiA9IE1hdGguY2VpbCBsIC8gMTZcblxuICBNID0gW11cblxuICBmb3IgaSBpbiBbIDAgLi4gTiAtIDEgXVxuICAgIE1baV0gPSBbXVxuXG4gICAgZm9yIGogaW4gWyAwIC4uIDE1IF0gIyMgZW5jb2RlIDQgY2hhcnMgcGVyIGludGVnZXIsIGJpZy1lbmRpYW4gZW5jb2RpbmdcbiAgICAgICMjIG5vdGUgcnVubmluZyBvZmYgdGhlIGVuZCBvZiBtc2cgaXMgb2sgJ2NvcyBiaXR3aXNlIG9wcyBvbiBOYU4gcmV0dXJuIDBcbiAgICAgIE1baV1bal0gPSAobXNnLmNoYXJDb2RlQXQoaSAqIDY0ICsgaiAqIDQgKyAwKSA8PCAyNCkgfFxuICAgICAgICAgICAgICAgIChtc2cuY2hhckNvZGVBdChpICogNjQgKyBqICogNCArIDEpIDw8IDE2KSB8XG4gICAgICAgICAgICAgICAgKG1zZy5jaGFyQ29kZUF0KGkgKiA2NCArIGogKiA0ICsgMikgPDwgIDgpIHxcbiAgICAgICAgICAgICAgICAobXNnLmNoYXJDb2RlQXQoaSAqIDY0ICsgaiAqIDQgKyAzKSA8PCAgMClcblxuICAjIyBhZGQgbGVuZ3RoIChpbiBiaXRzKSBpbnRvIGZpbmFsIHBhaXIgb2YgMzItYml0IGludGVnZXJzIChiaWctZW5kaWFuKVxuICAjIyBbNS4xLjFdXG4gICMjIG5vdGU6IG1vc3Qgc2lnbmlmaWNhbnQgd29yZCB3b3VsZCBiZSAobGVuIC0gMSkgKiA4ID4+PiAzMixcbiAgIyMgYnV0IHNpbmNlIEpTIGNvbnZlcnRzIGJpdHdpc2Utb3AgYXJncyB0byAzMiBiaXRzLFxuICAjIyB3ZSBuZWVkIHRvIHNpbXVsYXRlIHRoaXMgYnkgYXJpdGhtZXRpYyBvcGVyYXRvcnNcblxuICBUV09fVE9fVEhJUlRZX1RXTyA9IDQyOTQ5NjcyOTYgICMjIE1hdGgucG93KDIsIDMyKVxuICBNW04gLSAxXVsxNF0gPSAoKG1zZy5sZW5ndGggLSAxKSAqIDgpIC8gVFdPX1RPX1RISVJUWV9UV09cbiAgTVtOIC0gMV1bMTRdID0gTWF0aC5mbG9vcihNW04gLSAxXVsxNF0pXG4gIE1bTiAtIDFdWzE1XSA9ICgobXNnLmxlbmd0aCAtIDEpICogOCkgJiAweGZmZmZmZmZmXG5cbiAgIyMgc2V0IGluaXRpYWwgaGFzaCB2YWx1ZSBbNS4zLjFdXG4gIEgwID0gMHg2NzQ1MjMwMVxuICBIMSA9IDB4ZWZjZGFiODlcbiAgSDIgPSAweDk4YmFkY2ZlXG4gIEgzID0gMHgxMDMyNTQ3NlxuICBINCA9IDB4YzNkMmUxZjBcblxuICAjIyBIQVNIIENPTVBVVEFUSU9OIFs2LjEuMl1cblxuICBXID0gW11cblxuICBmb3IgaSBpbiBbIDAgLi4gTiAtIDFdXG4gICAgIyMgMSAtIHByZXBhcmUgbWVzc2FnZSBzY2hlZHVsZSAnVydcbiAgICBXW3RdID0gTVtpXVt0XSBmb3IgdCBpbiBbIDAgLi4gMTUgXVxuXG4gICAgZm9yIHQgaW4gWyAxNiAuLiA3OSBdXG4gICAgICBXW3RdID0gUk9UTCBXW3QgLSAzXSBeIFdbdCAtIDhdIF4gV1t0IC0gMTRdIF4gV1t0IC0gMTZdLCAxXG5cbiAgICAjIyAyIC0gaW5pdGlhbGlzZSBmaXZlIHdvcmtpbmcgdmFyaWFibGVzIGEsIGIsIGMsIGQsIGVcbiAgICAjIyB3aXRoIHByZXZpb3VzIGhhc2ggdmFsdWVcbiAgICBhID0gSDBcbiAgICBiID0gSDFcbiAgICBjID0gSDJcbiAgICBkID0gSDNcbiAgICBlID0gSDRcblxuICAgICMjIDMgLSBtYWluIGxvb3BcbiAgICBmb3IgdCBpbiBbIDAgLi4gNzkgXVxuICAgICAgcyA9IE1hdGguZmxvb3IgdCAvIDIwICMjIHNlcSBmb3IgYmxvY2tzIG9mICdmJyBmdW5jdGlvbnMgYW5kICdLJyBjb25zdGFudHNcbiAgICAgIFQgPSAoUk9UTChhLCA1KSArIGYocywgYiwgYywgZCkgKyBlICsgS1tzXSArIFdbdF0pICYgMHhmZmZmZmZmZlxuICAgICAgZSA9IGRcbiAgICAgIGQgPSBjXG4gICAgICBjID0gUk9UTChiLCAzMClcbiAgICAgIGIgPSBhXG4gICAgICBhID0gVFxuXG4gICAgIyMgNCAtIGNvbXB1dGUgdGhlIG5ldyBpbnRlcm1lZGlhdGUgaGFzaCB2YWx1ZVxuICAgIEgwID0gKEgwICsgYSkgJiAweGZmZmZmZmZmICAjIyBub3RlICdhZGRpdGlvbiBtb2R1bG8gMl4zMidcbiAgICBIMSA9IChIMSArIGIpICYgMHhmZmZmZmZmZlxuICAgIEgyID0gKEgyICsgYykgJiAweGZmZmZmZmZmXG4gICAgSDMgPSAoSDMgKyBkKSAmIDB4ZmZmZmZmZmZcbiAgICBINCA9IChINCArIGUpICYgMHhmZmZmZmZmZlxuXG4gIHJldHVybiB0b0hleFN0cihIMCkgK1xuICAgICAgICAgdG9IZXhTdHIoSDEpICtcbiAgICAgICAgIHRvSGV4U3RyKEgyKSArXG4gICAgICAgICB0b0hleFN0cihIMykgK1xuICAgICAgICAgdG9IZXhTdHIoSDQpXG5cbl9sZWFkaW5nMHMgPSAoaGV4U3RyKSAtPlxuICBudW0gPSAwXG4gIGZvciBwb3MgaW4gWyAwIC4uIGhleFN0ci5sZW5ndGggLSAxIF1cbiAgICBjdXJOdW0gPSBwYXJzZUludCBoZXhTdHJbcG9zXSwgMTZcbiAgICBicmVhayBpZiBpc05hTiBjdXJOdW1cblxuICAgIHN3aXRjaCBjdXJOdW1cbiAgICAgIHdoZW4gMGIwMDAwICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gbnVtICs9IDQgICMjIGNvbnRpbnVlXG4gICAgICB3aGVuIDBiMDAwMSAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBudW0gKyAzXG4gICAgICB3aGVuIDBiMDAxMCwgMGIwMDExICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBudW0gKyAyXG4gICAgICB3aGVuIDBiMDEwMCwgMGIwMTAxLCAwYjAxMTAsIDBiMDExMSB0aGVuIHJldHVybiBudW0gKyAxXG4gICAgICBlbHNlIHJldHVybiBudW1cblxuICBudW1cblxuX3RyeUNoYWxsZW5nZSA9IChkYXRhKSAtPlxuICBjaGFsbGVuZ2UgPSBcIiN7ZGF0YS5jaGFsbGVuZ2V9OiN7ZGF0YS5jb3VudGVyfVwiXG4gIHNoYSA9IF9zaGExaGFzaCBjaGFsbGVuZ2VcblxuICBpZiBfbGVhZGluZzBzKHNoYSkgPj0gZGF0YS5iaXRzXG4gICAgZGF0YS5yZXN1bHQgPSBjaGFsbGVuZ2VcbiAgICByZXR1cm4gdHJ1ZVxuXG4gIGRhdGEuY291bnRlciArPSAxXG4gIHJldHVybiBmYWxzZVxuXG5zaGExICAgICAgICAgICAgICA9IChtc2cpICAgIC0+IF9zaGExaGFzaChtc2cpXG5zaGExLmxlYWRpbmcwcyAgICA9IChoZXhTdHIpIC0+IF9sZWFkaW5nMHMoaGV4U3RyKVxuc2hhMS50cnlDaGFsbGVuZ2UgPSAoZGF0YSkgICAtPiBfdHJ5Q2hhbGxlbmdlKGRhdGEpXG5cbmhpZGRlbiA9XG4gIHdyaXRhYmxlOiAgICAgZmFsc2VcbiAgZW51bWVyYWJsZTogICBmYWxzZVxuICBjb25maWd1cmFibGU6IGZhbHNlXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSBzaGExLCBrZXksIGhpZGRlbiBmb3Igb3duIGtleSBvZiBzaGExXG5cbm1vZHVsZS5leHBvcnRzID0gc2hhMVxuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuUkVBRF9PTkxZID1cbiAgd3JpdGFibGU6ICAgICBmYWxzZVxuICBlbnVtZXJhYmxlOiAgIHRydWVcbiAgY29uZmlndXJhYmxlOiBmYWxzZVxuXG5ISURERU5fUkVBRF9PTkxZID1cbiAgd3JpdGFibGU6ICAgICBmYWxzZVxuICBlbnVtZXJhYmxlOiAgIGZhbHNlXG4gIGNvbmZpZ3VyYWJsZTogZmFsc2VcblxuZXhwb3J0cy5tYWtlUmVhZE9ubHkgPSAodHlwZSkgLT5cbiAgaWYgT2JqZWN0LmRlZmluZVByb3BlcnR5P1xuICAgIGZvciBvd24ga2V5IG9mIHR5cGUgd2hlbiB0eXBlb2Yga2V5IGlzIFwic3RyaW5nXCIgYW5kIGtleVswXSBpcyAnXydcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSB0eXBlLCBrZXksIGVudW1lcmFibGU6IGZhbHNlXG4iLCJleHBvcnRzLnNwYXduID0gZnVuY3Rpb24gKCkge307XG5leHBvcnRzLmV4ZWMgPSBmdW5jdGlvbiAoKSB7fTtcbiIsIlwidXNlIHN0cmljdFwiXG5cbiNvcyAgICAgICAgICAgPSByZXF1aXJlIFwib3NcIlxuY2hpbGRQcm9jZXNzID0gcmVxdWlyZSBcImNoaWxkX3Byb2Nlc3NcIlxuc2hhMSAgICAgICAgID0gcmVxdWlyZSBcIi4vc2hhMS5jb2ZmZWVcIlxucHJvcGVydGllcyAgID0gcmVxdWlyZSBcIi4vcHJvcGVydGllcy5jb2ZmZWVcIlxuXG5USU1FT1VUX01BWF9SVU5USU1FID0gOTlcblRJTUVPVVRfWUlFTERfVElNRSAgPSAgMVxuXG5jbGFzcyBUYXNrTWFzdGVyXG4gIEBSQU5HRV9JTkNSRU1FTlQ6IE1hdGgucG93IDIsIDE1XG5cbiAgY29uc3RydWN0b3I6IChAX2NhbGxlciwgQF9jYiwgQF9yYW5nZSkgLT5cbiAgICAjcHJvcGVydGllcy5tYWtlUmVhZE9ubHkgdGhpc1xuXG4gIF9zZW5kOiAoZGF0YSkgLT5cbiAgICBAX3NwYXduKClcbiAgICByZXR1cm4gdW5sZXNzIEBzZW5kRm4/XG4gICAgQHNlbmRGbiBkYXRhXG5cbiAgX3NwYXduOiAtPlxuICAgIHJldHVybiBpZiBAd29ya2VyP1xuICAgIEBjb25uZWN0KClcblxuICBfaW5jUmFuZ2U6IC0+XG4gICAgQF9yYW5nZS5iZWdpbiA9IEBfcmFuZ2UuZW5kICsgMVxuICAgIEBfcmFuZ2UuZW5kID0gQF9yYW5nZS5iZWdpbiArIFRhc2tNYXN0ZXIuUkFOR0VfSU5DUkVNRU5UIC0gMVxuXG4gIF9zZW5kUmFuZ2U6IC0+XG4gICAgQF9pbmNSYW5nZSgpXG4gICAgQF9zZW5kIG06IFwicmFuZ2VcIiwgcmFuZ2U6IEBfcmFuZ2VcblxuICBfZ290UmVzdWx0OiAocmVzdWx0KSAtPlxuICAgIHJldHVybiB1bmxlc3MgcmVzdWx0P1xuICAgIEBfY2IuY2FsbCBAX2NhbGxlciwgcmVzdWx0XG5cbiAgX2dvdE1lc3NhZ2U6IChtc2cpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBtc2c/Lm0/XG5cbiAgICBzd2l0Y2ggbXNnLm1cbiAgICAgIHdoZW4gXCJyZXF1ZXN0X3JhbmdlXCIgdGhlbiBAX3NlbmRSYW5nZSgpXG4gICAgICB3aGVuIFwicmVzdWx0XCIgdGhlbiBAX2dvdFJlc3VsdCBtc2cucmVzdWx0XG4gICAgICB3aGVuIFwiY29uc29sZV9sb2dcIiB0aGVuIGNvbnNvbGUubG9nIFwid29ya2VyXCIsIG1zZy5kYXRhXG5cbiAgc2VuZERhdGE6IChkYXRhKSAtPiBAX3NlbmQgbTogXCJkYXRhXCIsIGRhdGE6IGRhdGFcblxuICBzdG9wOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHdvcmtlcj9cbiAgICBAZGlzY29ubmVjdCgpXG4gICAgZGVsZXRlIEB3b3JrZXJcbiAgICBkZWxldGUgQHNlbmRGblxuXG5jbGFzcyBOb2RlVGFza01hc3RlciBleHRlbmRzIChUYXNrTWFzdGVyKVxuICAjQE1BWF9OVU1fV09SS0VSUyAgICAgPSBpZiBvcy5jcHVzPyB0aGVuIG9zLmNwdXMoKS5sZW5ndGggZWxzZSA0XG4gIEBNQVhfTlVNX1dPUktFUlMgPSA4XG4gIEBERUZBVUxUX05VTV9XT1JLRVJTID0gQE1BWF9OVU1fV09SS0VSU1xuXG4gIGNvbnN0cnVjdG9yOiAoY2FsbGVyLCBjYiwgcmFuZ2UpIC0+XG4gICAgc3VwZXIgY2FsbGVyLCBjYiwgcmFuZ2VcbiAgICBwcm9wZXJ0aWVzLm1ha2VSZWFkT25seSB0aGlzXG5cbiAgY29ubmVjdDogLT5cbiAgICBAd29ya2VyID0gY2hpbGRQcm9jZXNzLmZvcmsgX19kaXJuYW1lICsgXCIvd29ya2VyLmpzXCJcbiAgICBtZSA9IHRoaXNcbiAgICBAd29ya2VyLm9uIFwibWVzc2FnZVwiLCAoZGF0YSkgLT4gbWUuX2dvdE1lc3NhZ2UgZGF0YVxuICAgIHByb3BlcnRpZXMubWFrZVJlYWRPbmx5IEB3b3JrZXJcbiAgICBAc2VuZEZuID0gKGRhdGEpIC0+IEB3b3JrZXIuc2VuZCBkYXRhXG5cbiAgZGlzY29ubmVjdDogLT4gQHdvcmtlci5kaXNjb25uZWN0KClcblxuY2xhc3MgV2ViVGFza01hc3RlciBleHRlbmRzIChUYXNrTWFzdGVyKVxuICBATUFYX05VTV9XT1JLRVJTICAgICA9IDhcbiAgQERFRkFVTFRfTlVNX1dPUktFUlMgPSA0XG5cbiAgY29uc3RydWN0b3I6IChjYWxsZXIsIGNiLCByYW5nZSwgQGZpbGUpIC0+XG4gICAgc3VwZXIgY2FsbGVyLCBjYiwgcmFuZ2VcbiAgICBwcm9wZXJ0aWVzLm1ha2VSZWFkT25seSB0aGlzXG5cbiAgY29ubmVjdDogLT5cbiAgICBAd29ya2VyID0gbmV3IFdvcmtlciBAZmlsZVxuICAgIG1lID0gdGhpc1xuICAgIEB3b3JrZXIub25tZXNzYWdlID0gKGV2ZW50KSAtPiBtZS5fZ290TWVzc2FnZSBldmVudC5kYXRhXG4gICAgcHJvcGVydGllcy5tYWtlUmVhZE9ubHkgQHdvcmtlclxuICAgIEBzZW5kRm4gPSAoZGF0YSkgLT4gQHdvcmtlci5wb3N0TWVzc2FnZSBkYXRhXG5cbiAgZGlzY29ubmVjdDogLT4gQHdvcmtlci50ZXJtaW5hdGUoKVxuXG5jbGFzcyBUaW1lb3V0VGFza01hc3RlclxuICBATUFYX05VTV9XT1JLRVJTICAgICA9ICAxXG4gIEBERUZBVUxUX05VTV9XT1JLRVJTID0gIDFcblxuICBjb25zdHJ1Y3RvcjogKEBfY2FsbGVyLCBAX2NiKSAtPlxuICAgIHByb3BlcnRpZXMubWFrZVJlYWRPbmx5IHRoaXNcblxuICBzZW5kRGF0YTogKEBfZGF0YSkgLT5cbiAgICBkZWxldGUgQF9zdG9wRmxhZ1xuICAgIEBzdGFydCgpXG5cbiAgc3RhcnQ6IC0+XG4gICAgc3RhcnRUaW1lID0gbmV3IERhdGUoKVxuXG4gICAgdW50aWwgQF9zdG9wRmxhZz8gb3IgQF9kYXRhLnJlc3VsdD8gb3JcbiAgICAgICAgICAobmV3IERhdGUoKSAtIHN0YXJ0VGltZSA+PSBUSU1FT1VUX01BWF9SVU5USU1FKVxuICAgICAgc2hhMS50cnlDaGFsbGVuZ2UgQF9kYXRhXG5cbiAgICBpZiBAX3N0b3BGbGFnP1xuICAgICAgIyMgZG8gbm90aGluZ1xuICAgIGVsc2UgaWYgQF9kYXRhLnJlc3VsdD9cbiAgICAgIEBfY2IuY2FsbCBAX2NhbGxlciwgQF9kYXRhLnJlc3VsdFxuICAgIGVsc2VcbiAgICAgIG1lID0gdGhpc1xuICAgICAgc2V0VGltZW91dCAoIC0+IG1lLnN0YXJ0KCkpLCBUSU1FT1VUX1lJRUxEX1RJTUVcblxuICBzdG9wOiAtPiBAX3N0b3BGbGFnID0gdHJ1ZVxuXG5wcm9wZXJ0aWVzLm1ha2VSZWFkT25seSB0eXBlIGZvciB0eXBlIGluIFtcbiAgVGFza01hc3RlcixcbiAgVGFza01hc3Rlcjo6LFxuICBOb2RlVGFza01hc3RlcixcbiAgTm9kZVRhc2tNYXN0ZXI6OixcbiAgV2ViVGFza01hc3RlcixcbiAgV2ViVGFza01hc3Rlcjo6LFxuICBUaW1lb3V0VGFza01hc3RlcixcbiAgVGltZW91dFRhc2tNYXN0ZXI6OlxuXVxuXG5leHBvcnRzLk5vZGVUYXNrTWFzdGVyICAgID0gTm9kZVRhc2tNYXN0ZXJcbmV4cG9ydHMuV2ViVGFza01hc3RlciAgICAgPSBXZWJUYXNrTWFzdGVyXG5leHBvcnRzLlRpbWVvdXRUYXNrTWFzdGVyID0gVGltZW91dFRhc2tNYXN0ZXJcbiJdfQ==
;