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
    var key;
    if (Object.defineProperty != null) {
      for (key in type) {
        if (!__hasProp.call(type, key)) continue;
        if (typeof key === "string" && key[0] === '_') {
          Object.defineProperty(type, key, {
            enumerable: false
          });
        }
      }
    }
    if (Object.freeze != null) {
      return Object.freeze(type);
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
      console.log("adding worker");
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
},{"child_process":6,"./sha1.coffee":3,"./properties.coffee":5}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qcnViaW4vd29ya2luZy9ub2RlLWhhc2hjYXNoL2xpYi9icm93c2VyLmNvZmZlZSIsIi9ob21lL2pydWJpbi93b3JraW5nL25vZGUtaGFzaGNhc2gvbGliL2hhc2hjYXNoLmNvZmZlZSIsIi9ob21lL2pydWJpbi93b3JraW5nL25vZGUtaGFzaGNhc2gvbGliL3NoYTEuY29mZmVlIiwiL2hvbWUvanJ1YmluL3dvcmtpbmcvbm9kZS1oYXNoY2FzaC9saWIvcHJvcGVydGllcy5jb2ZmZWUiLCIvaG9tZS9qcnViaW4vd29ya2luZy9ub2RlLWhhc2hjYXNoL25vZGVfbW9kdWxlcy9ncnVudC1jb2ZmZWVpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL2NoaWxkX3Byb2Nlc3MuanMiLCIvaG9tZS9qcnViaW4vd29ya2luZy9ub2RlLWhhc2hjYXNoL2xpYi90YXNrbWFzdGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Q0FBQSxDQUFBLFVBQUE7Q0FBQSxDQUNBLENBQWtCLEdBQVosQ0FBWSxDQUFsQixXQUFrQjtDQURsQjs7Ozs7QUNBQTtDQUFBLENBQUEsVUFBQTtDQUFBLEtBQUEsd0dBQUE7O0NBQUEsQ0FJQSxDQUFhLENBQWIsR0FBYSxRQUFBOztDQUpiLENBS0EsQ0FBYSxJQUFBLEdBQWIsV0FBYTs7Q0FMYixDQU1BLENBQWEsSUFBQSxHQUFiLFdBQWE7O0NBTmIsQ0FRQSxDQUFvQixPQUFVLElBQTlCOztDQVJBLENBU0EsQ0FBb0IsT0FBVSxHQUE5Qjs7Q0FUQSxDQVVBLENBQW9CLE9BQVUsT0FBOUI7O0NBVkEsQ0FlQSxDQUFhLENBQUEsS0FBQyxDQUFkO0FBQ0ssQ0FBSCxHQUFBLENBQW1CLENBQWhCLEVBQUg7Q0FDRSxHQUFlLENBQWlCLENBQWhDO0NBQUEsR0FBQSxXQUFPO1FBQVA7Q0FDQSxHQUFBLFNBQU87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QixPQUFQOztDQWhJQSxDQWlJQSxDQUE0QixJQUFyQixNQUFQOztDQWpJQSxDQWtJQSxDQUE0QixJQUFyQixVQUFQO0NBbElBIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCJcbndpbmRvdy5IYXNoQ2FzaCA9IHJlcXVpcmUgXCIuL2hhc2hjYXNoLmNvZmZlZVwiXG4iLCJcInVzZSBzdHJpY3RcIlxuXG4jIyB3ZSB1c2Ugb3VyIG93biBzaGExIGluc3RlYWQgb2YgY3J5cHRvIGZvciBhIG1vcmUgbGVhbiBicm93c2VyXG4jIyBpbXBsZW1lbnRhdGlvbiB3aXRoIGJyb3dzZXJpZnlcbnNoYTEgICAgICAgPSByZXF1aXJlIFwiLi9zaGExLmNvZmZlZVwiXG50YXNrbWFzdGVyID0gcmVxdWlyZSBcIi4vdGFza21hc3Rlci5jb2ZmZWVcIlxucHJvcGVydGllcyA9IHJlcXVpcmUgXCIuL3Byb3BlcnRpZXMuY29mZmVlXCJcblxuTm9kZVRhc2tNYXN0ZXIgICAgPSB0YXNrbWFzdGVyLk5vZGVUYXNrTWFzdGVyXG5XZWJUYXNrTWFzdGVyICAgICA9IHRhc2ttYXN0ZXIuV2ViVGFza01hc3RlclxuVGltZW91dFRhc2tNYXN0ZXIgPSB0YXNrbWFzdGVyLlRpbWVvdXRUYXNrTWFzdGVyXG5cbiMjIGhhc2hjYXNoIGZvcm1hdDpcbiMjIHZlcjpiaXRzOmRhdGU6cmVzb3VyY2U6cmFuZDpjb3VudGVyXG5cbl9idWlsZERhdGUgPSAoZGF0ZSkgLT5cbiAgaWYgdHlwZW9mKGRhdGUpIGlzIFwic3RyaW5nXCJcbiAgICByZXR1cm4gbnVsbCBpZiBkYXRlLmxlbmd0aCBpc250IDZcbiAgICByZXR1cm4gZGF0ZVxuXG4gIHJldHVybiBudWxsIGlmIHR5cGVvZihkYXRlKSBpc250IFwibnVtYmVyXCJcblxuICByZXR1cm4gX2J1aWxkRGF0ZSBcIiN7ZGF0ZX1cIlxuXG5fbmV4dFBvcyA9IChzdHIsIHBvcykgLT5cbiAgcG9zLnN0YXJ0ID0gcG9zLmVuZCArIDFcbiAgcmV0dXJuIGZhbHNlIGlmIHBvcy5zdGFydCBpcyBzdHIubGVuZ3RoXG4gIHBvcy5lbmQgPSBzdHIuaW5kZXhPZiAnOicsIHBvcy5zdGFydFxuICByZXR1cm4gZmFsc2UgaWYgcG9zLmVuZCBpcyAtMVxuICByZXR1cm4gZmFsc2UgaWYgcG9zLmVuZCBpcyBwb3Muc3RhcnRcbiAgdHJ1ZVxuXG5jbGFzcyBIYXNoQ2FzaFxuICAjIyBTVEFUSUNcblxuICBAVkVSU0lPTjogICAxXG4gIEBNSU5fQklUUzogMTZcbiAgQGhhc2g6ICAgc2hhMVxuXG4gIEBkYXRlOiAtPlxuICAgIG5vdyA9IG5ldyBEYXRlKClcbiAgICB5eSA9IChcIjBcIiArIChub3cuZ2V0WWVhcigpIC0gMTAwKSlbLTIuLl1cbiAgICBtbSA9ICgnMCcgKyAobm93LmdldE1vbnRoKCkgKyAxKSlbLTIuLl1cbiAgICBkZCA9ICgnMCcgKyBub3cuZ2V0RGF0ZSgpKVstMi4uXVxuXG4gICAgXCIje3l5fSN7bW19I3tkZH1cIlxuXG4gIEBwYXJzZTogKHN0cikgLT5cbiAgICByZXR1cm4gbnVsbCBpZiBub3Qgc3RyP1xuXG4gICAgZGF0YSA9IHt9XG5cbiAgICBwb3MgPSBzdGFydDogMCwgZW5kOiAtMSwgbGVuZ3RoOiAtPiBAZW5kIC0gQHN0YXJ0XG5cbiAgICByZXR1cm4gbnVsbCBpZiBub3QgX25leHRQb3Mgc3RyLCBwb3NcbiAgICBkYXRhLnZlcnNpb24gPSBwYXJzZUludCBzdHIuc3Vic3RyKHBvcy5zdGFydCwgcG9zLmxlbmd0aCgpKSwgMTBcbiAgICByZXR1cm4gbnVsbCBpZiBpc05hTiBkYXRhLnZlcnNpb25cblxuICAgIHJldHVybiBudWxsIGlmIG5vdCBfbmV4dFBvcyBzdHIsIHBvc1xuICAgIGRhdGEuYml0cyA9IHBhcnNlSW50IHN0ci5zdWJzdHIocG9zLnN0YXJ0LCBwb3MubGVuZ3RoKCkpLCAxMFxuICAgIHJldHVybiBudWxsIGlmIGlzTmFOIGRhdGEuYml0c1xuXG4gICAgcmV0dXJuIG51bGwgaWYgbm90IF9uZXh0UG9zIHN0ciwgcG9zXG4gICAgZGF0YS5kYXRlID0gcGFyc2VJbnQgc3RyLnN1YnN0cihwb3Muc3RhcnQsIHBvcy5sZW5ndGgoKSksIDEwXG4gICAgcmV0dXJuIG51bGwgaWYgaXNOYU4gZGF0YS5kYXRlXG5cbiAgICByZXR1cm4gbnVsbCBpZiBub3QgX25leHRQb3Mgc3RyLCBwb3NcbiAgICBkYXRhLnJlc291cmNlID0gc3RyLnN1YnN0ciBwb3Muc3RhcnQsIHBvcy5sZW5ndGgoKVxuICAgIHJldHVybiBudWxsIGlmIG5vdCBkYXRhLnJlc291cmNlLmxlbmd0aFxuXG4gICAgcmV0dXJuIG51bGwgaWYgbm90IF9uZXh0UG9zIHN0ciwgcG9zXG4gICAgZGF0YS5yYW5kID0gc3RyLnN1YnN0ciBwb3Muc3RhcnQsIHBvcy5sZW5ndGgoKVxuICAgIHJldHVybiBudWxsIGlmIG5vdCBkYXRhLnJhbmQubGVuZ3RoXG5cbiAgICAjIyBhbGxvdyAtMSBmb3IgcG9zLmVuZCBhcyBpdCdzIHRoZSBsYXN0IGZpZWxkXG4gICAgX25leHRQb3Mgc3RyLCBwb3NcbiAgICBjb3VudGVyRW5kID0gKGlmIHBvcy5lbmQgaXMgLTEgdGhlbiBzdHIubGVuZ3RoIGVsc2UgcG9zLmVuZCkgLSBwb3Muc3RhcnRcbiAgICBkYXRhLmNvdW50ZXIgPSBwYXJzZUludCBzdHIuc3Vic3RyKHBvcy5zdGFydCwgY291bnRlckVuZCksIDEwXG4gICAgcmV0dXJuIG51bGwgaWYgaXNOYU4gZGF0YS5jb3VudGVyXG5cbiAgICBkYXRhXG5cbiAgQHVucGFyc2U6IChwYXJ0cykgLT5cbiAgICByZXQgPSBcIlwiXG5cbiAgICByZXR1cm4gcmV0IGlmIG5vdCBwYXJ0cy52ZXJzaW9uP1xuICAgIHJldCArPSBcIiN7cGFydHMudmVyc2lvbn06XCJcblxuICAgIHJldHVybiByZXQgaWYgbm90IHBhcnRzLmJpdHM/XG4gICAgcmV0ICs9IFwiI3twYXJ0cy5iaXRzfTpcIlxuXG4gICAgcmV0dXJuIHJldCBpZiBub3QgcGFydHMuZGF0ZT9cbiAgICBkYXRlID0gX2J1aWxkRGF0ZSBwYXJ0cy5kYXRlXG4gICAgcmV0dXJuIHJldCBpZiBub3QgZGF0ZT9cbiAgICByZXQgKz0gXCIje2RhdGV9OlwiXG5cbiAgICByZXR1cm4gcmV0IGlmIG5vdCBwYXJ0cy5yZXNvdXJjZT9cbiAgICByZXQgKz0gXCIje3BhcnRzLnJlc291cmNlfTpcIlxuXG4gICAgcmV0dXJuIHJldCBpZiBub3QgcGFydHMucmFuZD9cbiAgICByZXQgKz0gcGFydHMucmFuZFxuXG4gICAgcmV0dXJuIHJldCBpZiBub3QgcGFydHMuY291bnRlcj9cbiAgICByZXQgKz0gXCI6I3twYXJ0cy5jb3VudGVyfVwiXG5cbiAgICByZXRcblxuICAjIyBJTlNUQU5DRVxuXG4gIGNvbnN0cnVjdG9yOiAoQF9iaXRzLCBjYiwgY2FsbGVyLCB3b3JrZXJGaWxlLCBudW1Xb3JrZXJzKSAtPlxuICAgIEBfYml0cyA9IEhhc2hDYXNoLk1JTl9CSVRTIGlmIEBfYml0cyA8IEhhc2hDYXNoLk1JTl9CSVRTXG4gICAgQF93b3JrZXJzID0gW11cbiAgICBAX3JhbmdlID0ge31cbiAgICBAX3Jlc2V0UmFuZ2UoKVxuXG4gICAgIyMjXG4gICAgVXNlIGRpZmZlcmVudCBzdHJhdGVnaWVzIHRvIGVuc3VyZSB0aGUgbWFpbiBqYXZhc2NyaXB0IHRocmVhZCBpcyBub3RcbiAgICBodW5nIHVwIHdoaWxlIGdlbmVyYXRpbmcgdGhlIGhhc2hjYXNoXG5cbiAgICAxLiBVbmRlciBOb2RlLCB3ZSB1c2UgY2hpbGRfcHJvY2Vzc1xuICAgIDIuIEluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBpdCwgdXNlIHdlYiB3b3JrZXJzXG4gICAgMy4gSW4gb3RoZXIgYnJvd3NlcnMsIHVzZSBzZXRUaW1lb3V0XG4gICAgIyMjXG5cbiAgICBpZiBub3Qgd2luZG93P1xuICAgICAgIyMgcnVubmluZyB1bmRlciBub2RlXG4gICAgICB0eXBlID0gTm9kZVRhc2tNYXN0ZXJcbiAgICBlbHNlIGlmIFdvcmtlcj8gYW5kIHdvcmtlckZpbGU/XG4gICAgICAjIyBicm93c2VyIHdpdGggd2ViIHdvcmtlcnNcbiAgICAgIHR5cGUgPSBXZWJUYXNrTWFzdGVyXG4gICAgZWxzZVxuICAgICAgIyMgb3RoZXIgYnJvd3NlclxuICAgICAgdHlwZSA9IFRpbWVvdXRUYXNrTWFzdGVyXG5cbiAgICBpZiBudW1Xb3JrZXJzP1xuICAgICAgbnVtV29ya2VycyA9IE1hdGgubWluIG51bVdvcmtlcnMsIHR5cGUuTUFYX05VTV9XT1JLRVJTXG4gICAgZWxzZVxuICAgICAgbnVtV29ya2VycyA9IHR5cGUuREVGQVVMVF9OVU1fV09SS0VSU1xuXG4gICAgcmV0dXJuIHVubGVzcyBudW1Xb3JrZXJzXG5cbiAgICBjb25zb2xlLmxvZyBcInVzaW5nICN7bnVtV29ya2Vyc30gd29ya2Vyc1wiXG5cbiAgICB3cmFwcGVkQ2IgPSAocmVzdWx0KSAtPlxuICAgICAgIyMgcHJldmVudCByYWNlcyB3aGVyZSBtdWx0aXBsZSB3b3JrZXJzIHJldHVybmVkIGEgcmVzdWx0XG4gICAgICBAc3RvcCgpXG4gICAgICBpZiBjYWxsZXI/XG4gICAgICAgIGNiLmNhbGwgY2FsbGVyLCByZXN1bHRcbiAgICAgIGVsc2VcbiAgICAgICAgY2IgcmVzdWx0XG5cbiAgICBAX3dvcmtlcnMgPSAoXG4gICAgICBmb3IgbnVtIGluIFsgMSAuLiBudW1Xb3JrZXJzIF1cbiAgICAgICAgd29ya2VyID0gbmV3IHR5cGUgdGhpcywgd3JhcHBlZENiLCBAX3JhbmdlLCB3b3JrZXJGaWxlXG4gICAgICAgICNwcm9wZXJ0aWVzLm1ha2VSZWFkT25seSB3b3JrZXJcbiAgICAgICAgd29ya2VyXG4gICAgKVxuXG4gICAgI3Byb3BlcnRpZXMubWFrZVJlYWRPbmx5IHR5cGUgZm9yIHR5cGUgaW4gWyBAX3dvcmtlcnMsIHRoaXMgXVxuXG4gICMjIFBSSVZBVEVcblxuICBfcmVzZXRSYW5nZTogLT4gQF9yYW5nZSA9IGJlZ2luOiAwLCBlbmQ6IC0xXG4gIF9zZW5kRGF0YTogKGRhdGEpIC0+IHdvcmtlci5zZW5kRGF0YSBkYXRhIGZvciB3b3JrZXIgaW4gQF93b3JrZXJzXG5cbiAgIyMgUFVCTElDXG5cbiAgc3RvcDogLT4gd29ya2VyLnN0b3AoKSBmb3Igd29ya2VyIGluIEBfd29ya2Vyc1xuXG4gIGdlbmVyYXRlOiAocmVzb3VyY2UpIC0+XG4gICAgQF9yZXNldFJhbmdlKClcblxuICAgIHBhcnRzID1cbiAgICAgIHZlcnNpb246IEhhc2hDYXNoLlZFUlNJT05cbiAgICAgIGJpdHM6IEBfYml0c1xuICAgICAgZGF0ZTogSGFzaENhc2guZGF0ZSgpXG4gICAgICByZXNvdXJjZTogcmVzb3VyY2VcbiAgICAgIHJhbmQ6IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0ciAyXG5cbiAgICBkYXRhID1cbiAgICAgIGNoYWxsZW5nZTogSGFzaENhc2gudW5wYXJzZSBwYXJ0c1xuICAgICAgY291bnRlcjogMFxuICAgICAgYml0czogcGFydHMuYml0c1xuXG4gICAgQF9zZW5kRGF0YSBkYXRhXG5cbiAgdmFsaWRhdGU6IChzdHIpIC0+XG4gICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBzdHI/XG4gICAgcmV0dXJuIGZhbHNlIGlmIG5vdCBAX2JpdHM/XG5cbiAgICBkYXRhID0gSGFzaENhc2gucGFyc2Ugc3RyXG5cbiAgICByZXR1cm4gZmFsc2UgaWYgbm90IGRhdGE/XG4gICAgcmV0dXJuIGZhbHNlIGlmIGRhdGEuYml0cyA8IEBfYml0c1xuICAgIHJldHVybiBmYWxzZSBpZiBkYXRhLmJpdHMgPCBIYXNoQ2FzaC5NSU5fQklUU1xuXG4gICAgcmV0dXJuIGZhbHNlIGlmIGRhdGEudmVyc2lvbiBpc250IEhhc2hDYXNoLlZFUlNJT05cblxuICAgIG5vdyA9IEhhc2hDYXNoLmRhdGUoKVxuICAgIHJldHVybiBmYWxzZSBpZiBkYXRhLmRhdGUgPCBub3cgLSAxIG9yIGRhdGEuZGF0ZSA+IG5vdyArIDFcblxuICAgIHNoYTEubGVhZGluZzBzKEhhc2hDYXNoLmhhc2goc3RyKSkgPj0gZGF0YS5iaXRzXG5cbiNwcm9wZXJ0aWVzLm1ha2VSZWFkT25seSB0eXBlIGZvciB0eXBlIGluIFsgSGFzaENhc2gsIEhhc2hDYXNoOjogXVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhhc2hDYXNoXG4iLCJcInVzZSBzdHJpY3RcIlxuXG5ST1RMID0gKHgsIG4pIC0+XG4gIHJldHVybiAoeCA8PCBuKSB8ICh4ID4+PiAoMzIgLSBuKSlcblxudG9IZXhTdHIgPSAobikgLT5cbiAgcyA9IFwiXCJcblxuICBmb3IgaSBpbiBbIDcgLi4gMCBdXG4gICAgdiA9IChuID4+PiAoaSAqIDQpKSAmIDB4ZlxuICAgIHMgKz0gdi50b1N0cmluZyAxNlxuXG4gIHNcblxuZiA9IChzLCB4LCB5LCB6KSAtPlxuICBzd2l0Y2ggc1xuICAgIHdoZW4gMCB0aGVuICh4ICYgeSkgXiAofnggJiB6KSAgICAgICAgICAgIyMgQ2goKVxuICAgIHdoZW4gMSB0aGVuIHggXiB5IF4geiAgICAgICAgICAgICAgICAgICAgIyMgUGFyaXR5KClcbiAgICB3aGVuIDIgdGhlbiAoeCAmIHkpIF4gKHggJiB6KSBeICh5ICYgeikgICMjIE1haigpXG4gICAgd2hlbiAzIHRoZW4geCBeIHkgXiB6ICAgICAgICAgICAgICAgICAgICAjIyBQYXJpdHkoKVxuXG5fc2hhMWhhc2ggPSAobXNnKSAtPlxuICAjIyBjb25zdGFudHMgWzQuMi4xXVxuICBLID0gW1xuICAgIDB4NWE4Mjc5OTlcbiAgICAweDZlZDllYmExXG4gICAgMHg4ZjFiYmNkY1xuICAgIDB4Y2E2MmMxZDZcbiAgXVxuXG4gICMjIFBSRVBST0NFU1NJTkdcblxuICAjIyBhZGQgdHJhaWxpbmcgJzEnIGJpdCAoKyAwJ3MgcGFkZGluZykgdG8gc3RyaW5nIFs1LjEuMV1cbiAgbXNnICs9IFN0cmluZy5mcm9tQ2hhckNvZGUgMHg4MFxuXG4gICMjIGNvbnZlcnQgc3RyaW5nIG1zZyBpbnRvIDUxMi1iaXQgLyAxNi1pbnRlZ2VyIGJsb2NrcyBhcnJheXMgb2YgaW50cyBbNS4yLjFdXG5cbiAgIyMgbGVuZ3RoIChpbiAzMi1iaXQgaW50ZWdlcnMpIG9mIG1zZyArIDEgKyBhcHBlbmRlZCBsZW5ndGhcbiAgbCA9IG1zZy5sZW5ndGggLyA0ICsgMlxuXG4gICMjIG51bWJlciBvZiAxNi1pbnRlZ2VyLWJsb2NrcyByZXF1aXJlZCB0byBob2xkICdsJyBpbnRzXG4gIE4gPSBNYXRoLmNlaWwgbCAvIDE2XG5cbiAgTSA9IFtdXG5cbiAgZm9yIGkgaW4gWyAwIC4uIE4gLSAxIF1cbiAgICBNW2ldID0gW11cblxuICAgIGZvciBqIGluIFsgMCAuLiAxNSBdICMjIGVuY29kZSA0IGNoYXJzIHBlciBpbnRlZ2VyLCBiaWctZW5kaWFuIGVuY29kaW5nXG4gICAgICAjIyBub3RlIHJ1bm5pbmcgb2ZmIHRoZSBlbmQgb2YgbXNnIGlzIG9rICdjb3MgYml0d2lzZSBvcHMgb24gTmFOIHJldHVybiAwXG4gICAgICBNW2ldW2pdID0gKG1zZy5jaGFyQ29kZUF0KGkgKiA2NCArIGogKiA0ICsgMCkgPDwgMjQpIHxcbiAgICAgICAgICAgICAgICAobXNnLmNoYXJDb2RlQXQoaSAqIDY0ICsgaiAqIDQgKyAxKSA8PCAxNikgfFxuICAgICAgICAgICAgICAgIChtc2cuY2hhckNvZGVBdChpICogNjQgKyBqICogNCArIDIpIDw8ICA4KSB8XG4gICAgICAgICAgICAgICAgKG1zZy5jaGFyQ29kZUF0KGkgKiA2NCArIGogKiA0ICsgMykgPDwgIDApXG5cbiAgIyMgYWRkIGxlbmd0aCAoaW4gYml0cykgaW50byBmaW5hbCBwYWlyIG9mIDMyLWJpdCBpbnRlZ2VycyAoYmlnLWVuZGlhbilcbiAgIyMgWzUuMS4xXVxuICAjIyBub3RlOiBtb3N0IHNpZ25pZmljYW50IHdvcmQgd291bGQgYmUgKGxlbiAtIDEpICogOCA+Pj4gMzIsXG4gICMjIGJ1dCBzaW5jZSBKUyBjb252ZXJ0cyBiaXR3aXNlLW9wIGFyZ3MgdG8gMzIgYml0cyxcbiAgIyMgd2UgbmVlZCB0byBzaW11bGF0ZSB0aGlzIGJ5IGFyaXRobWV0aWMgb3BlcmF0b3JzXG5cbiAgVFdPX1RPX1RISVJUWV9UV08gPSA0Mjk0OTY3Mjk2ICAjIyBNYXRoLnBvdygyLCAzMilcbiAgTVtOIC0gMV1bMTRdID0gKChtc2cubGVuZ3RoIC0gMSkgKiA4KSAvIFRXT19UT19USElSVFlfVFdPXG4gIE1bTiAtIDFdWzE0XSA9IE1hdGguZmxvb3IoTVtOIC0gMV1bMTRdKVxuICBNW04gLSAxXVsxNV0gPSAoKG1zZy5sZW5ndGggLSAxKSAqIDgpICYgMHhmZmZmZmZmZlxuXG4gICMjIHNldCBpbml0aWFsIGhhc2ggdmFsdWUgWzUuMy4xXVxuICBIMCA9IDB4Njc0NTIzMDFcbiAgSDEgPSAweGVmY2RhYjg5XG4gIEgyID0gMHg5OGJhZGNmZVxuICBIMyA9IDB4MTAzMjU0NzZcbiAgSDQgPSAweGMzZDJlMWYwXG5cbiAgIyMgSEFTSCBDT01QVVRBVElPTiBbNi4xLjJdXG5cbiAgVyA9IFtdXG5cbiAgZm9yIGkgaW4gWyAwIC4uIE4gLSAxXVxuICAgICMjIDEgLSBwcmVwYXJlIG1lc3NhZ2Ugc2NoZWR1bGUgJ1cnXG4gICAgV1t0XSA9IE1baV1bdF0gZm9yIHQgaW4gWyAwIC4uIDE1IF1cblxuICAgIGZvciB0IGluIFsgMTYgLi4gNzkgXVxuICAgICAgV1t0XSA9IFJPVEwgV1t0IC0gM10gXiBXW3QgLSA4XSBeIFdbdCAtIDE0XSBeIFdbdCAtIDE2XSwgMVxuXG4gICAgIyMgMiAtIGluaXRpYWxpc2UgZml2ZSB3b3JraW5nIHZhcmlhYmxlcyBhLCBiLCBjLCBkLCBlXG4gICAgIyMgd2l0aCBwcmV2aW91cyBoYXNoIHZhbHVlXG4gICAgYSA9IEgwXG4gICAgYiA9IEgxXG4gICAgYyA9IEgyXG4gICAgZCA9IEgzXG4gICAgZSA9IEg0XG5cbiAgICAjIyAzIC0gbWFpbiBsb29wXG4gICAgZm9yIHQgaW4gWyAwIC4uIDc5IF1cbiAgICAgIHMgPSBNYXRoLmZsb29yIHQgLyAyMCAjIyBzZXEgZm9yIGJsb2NrcyBvZiAnZicgZnVuY3Rpb25zIGFuZCAnSycgY29uc3RhbnRzXG4gICAgICBUID0gKFJPVEwoYSwgNSkgKyBmKHMsIGIsIGMsIGQpICsgZSArIEtbc10gKyBXW3RdKSAmIDB4ZmZmZmZmZmZcbiAgICAgIGUgPSBkXG4gICAgICBkID0gY1xuICAgICAgYyA9IFJPVEwoYiwgMzApXG4gICAgICBiID0gYVxuICAgICAgYSA9IFRcblxuICAgICMjIDQgLSBjb21wdXRlIHRoZSBuZXcgaW50ZXJtZWRpYXRlIGhhc2ggdmFsdWVcbiAgICBIMCA9IChIMCArIGEpICYgMHhmZmZmZmZmZiAgIyMgbm90ZSAnYWRkaXRpb24gbW9kdWxvIDJeMzInXG4gICAgSDEgPSAoSDEgKyBiKSAmIDB4ZmZmZmZmZmZcbiAgICBIMiA9IChIMiArIGMpICYgMHhmZmZmZmZmZlxuICAgIEgzID0gKEgzICsgZCkgJiAweGZmZmZmZmZmXG4gICAgSDQgPSAoSDQgKyBlKSAmIDB4ZmZmZmZmZmZcblxuICByZXR1cm4gdG9IZXhTdHIoSDApICtcbiAgICAgICAgIHRvSGV4U3RyKEgxKSArXG4gICAgICAgICB0b0hleFN0cihIMikgK1xuICAgICAgICAgdG9IZXhTdHIoSDMpICtcbiAgICAgICAgIHRvSGV4U3RyKEg0KVxuXG5fbGVhZGluZzBzID0gKGhleFN0cikgLT5cbiAgbnVtID0gMFxuICBmb3IgcG9zIGluIFsgMCAuLiBoZXhTdHIubGVuZ3RoIC0gMSBdXG4gICAgY3VyTnVtID0gcGFyc2VJbnQgaGV4U3RyW3Bvc10sIDE2XG4gICAgYnJlYWsgaWYgaXNOYU4gY3VyTnVtXG5cbiAgICBzd2l0Y2ggY3VyTnVtXG4gICAgICB3aGVuIDBiMDAwMCAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIG51bSArPSA0ICAjIyBjb250aW51ZVxuICAgICAgd2hlbiAwYjAwMDEgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gbnVtICsgM1xuICAgICAgd2hlbiAwYjAwMTAsIDBiMDAxMSAgICAgICAgICAgICAgICAgdGhlbiByZXR1cm4gbnVtICsgMlxuICAgICAgd2hlbiAwYjAxMDAsIDBiMDEwMSwgMGIwMTEwLCAwYjAxMTEgdGhlbiByZXR1cm4gbnVtICsgMVxuICAgICAgZWxzZSByZXR1cm4gbnVtXG5cbiAgbnVtXG5cbl90cnlDaGFsbGVuZ2UgPSAoZGF0YSkgLT5cbiAgY2hhbGxlbmdlID0gXCIje2RhdGEuY2hhbGxlbmdlfToje2RhdGEuY291bnRlcn1cIlxuICBzaGEgPSBfc2hhMWhhc2ggY2hhbGxlbmdlXG5cbiAgaWYgX2xlYWRpbmcwcyhzaGEpID49IGRhdGEuYml0c1xuICAgIGRhdGEucmVzdWx0ID0gY2hhbGxlbmdlXG4gICAgcmV0dXJuIHRydWVcblxuICBkYXRhLmNvdW50ZXIgKz0gMVxuICByZXR1cm4gZmFsc2Vcblxuc2hhMSAgICAgICAgICAgICAgPSAobXNnKSAgICAtPiBfc2hhMWhhc2gobXNnKVxuc2hhMS5sZWFkaW5nMHMgICAgPSAoaGV4U3RyKSAtPiBfbGVhZGluZzBzKGhleFN0cilcbnNoYTEudHJ5Q2hhbGxlbmdlID0gKGRhdGEpICAgLT4gX3RyeUNoYWxsZW5nZShkYXRhKVxuXG5oaWRkZW4gPVxuICB3cml0YWJsZTogICAgIGZhbHNlXG4gIGVudW1lcmFibGU6ICAgZmFsc2VcbiAgY29uZmlndXJhYmxlOiBmYWxzZVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkgc2hhMSwga2V5LCBoaWRkZW4gZm9yIG93biBrZXkgb2Ygc2hhMVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNoYTFcbiIsIlwidXNlIHN0cmljdFwiXG5cblJFQURfT05MWSA9XG4gIHdyaXRhYmxlOiAgICAgZmFsc2VcbiAgZW51bWVyYWJsZTogICB0cnVlXG4gIGNvbmZpZ3VyYWJsZTogZmFsc2VcblxuSElEREVOX1JFQURfT05MWSA9XG4gIHdyaXRhYmxlOiAgICAgZmFsc2VcbiAgZW51bWVyYWJsZTogICBmYWxzZVxuICBjb25maWd1cmFibGU6IGZhbHNlXG5cbmV4cG9ydHMubWFrZVJlYWRPbmx5ID0gKHR5cGUpIC0+XG4gIGlmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eT9cbiAgICBmb3Igb3duIGtleSBvZiB0eXBlIHdoZW4gdHlwZW9mIGtleSBpcyBcInN0cmluZ1wiIGFuZCBrZXlbMF0gaXMgJ18nXG4gICAgICAjbW9kZSA9IFJFQURfT05MWVxuICAgICAgI21vZGUgPSBISURERU5fUkVBRF9PTkxZIGlmIGtleVswXSBpcyAnXydcblxuICAgICAgI09iamVjdC5kZWZpbmVQcm9wZXJ0eSB0eXBlLCBrZXksIG1vZGVcbiAgICAgICNjb25zb2xlLmxvZyBcImhpZGluZ1wiLCBrZXlcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSB0eXBlLCBrZXksIGVudW1lcmFibGU6IGZhbHNlXG5cbiAgICAjaWYgdHlwZSBpbnN0YW5jZW9mIEFycmF5XG4gICAgIyAgT2JqZWN0LmRlZmluZVByb3BlcnR5IHR5cGUsIFwibGVuZ3RoXCIsXG4gICAgIyAgICB3cml0YWJsZTogICAgIGZhbHNlXG4gICAgIyAgICBjb25maWd1cmFibGU6IGZhbHNlXG5cbiAgI09iamVjdC5wcmV2ZW50RXh0ZW5zaW9ucyB0eXBlIGlmIE9iamVjdC5wcmV2ZW50RXh0ZW5zaW9ucz9cbiAgI09iamVjdC5zZWFsIHR5cGUgaWYgT2JqZWN0LnNlYWw/XG4gIE9iamVjdC5mcmVlemUgdHlwZSBpZiBPYmplY3QuZnJlZXplP1xuIiwiZXhwb3J0cy5zcGF3biA9IGZ1bmN0aW9uICgpIHt9O1xuZXhwb3J0cy5leGVjID0gZnVuY3Rpb24gKCkge307XG4iLCJcInVzZSBzdHJpY3RcIlxuXG4jb3MgICAgICAgICAgID0gcmVxdWlyZSBcIm9zXCJcbmNoaWxkUHJvY2VzcyA9IHJlcXVpcmUgXCJjaGlsZF9wcm9jZXNzXCJcbnNoYTEgICAgICAgICA9IHJlcXVpcmUgXCIuL3NoYTEuY29mZmVlXCJcbnByb3BlcnRpZXMgICA9IHJlcXVpcmUgXCIuL3Byb3BlcnRpZXMuY29mZmVlXCJcblxuVElNRU9VVF9NQVhfUlVOVElNRSA9IDk5XG5USU1FT1VUX1lJRUxEX1RJTUUgID0gIDFcblxuY2xhc3MgVGFza01hc3RlclxuICBAUkFOR0VfSU5DUkVNRU5UOiBNYXRoLnBvdyAyLCAxNVxuXG4gIGNvbnN0cnVjdG9yOiAoQF9jYWxsZXIsIEBfY2IsIEBfcmFuZ2UpIC0+XG4gICAgI3Byb3BlcnRpZXMubWFrZVJlYWRPbmx5IHRoaXNcblxuICBfc2VuZDogKGRhdGEpIC0+XG4gICAgQF9zcGF3bigpXG4gICAgcmV0dXJuIHVubGVzcyBAc2VuZEZuP1xuICAgIEBzZW5kRm4gZGF0YVxuXG4gIF9zcGF3bjogLT5cbiAgICByZXR1cm4gaWYgQHdvcmtlcj9cbiAgICBAY29ubmVjdCgpXG5cbiAgX2luY1JhbmdlOiAtPlxuICAgIEBfcmFuZ2UuYmVnaW4gPSBAX3JhbmdlLmVuZCArIDFcbiAgICBAX3JhbmdlLmVuZCA9IEBfcmFuZ2UuYmVnaW4gKyBUYXNrTWFzdGVyLlJBTkdFX0lOQ1JFTUVOVCAtIDFcblxuICBfc2VuZFJhbmdlOiAtPlxuICAgIEBfaW5jUmFuZ2UoKVxuICAgIEBfc2VuZCBtOiBcInJhbmdlXCIsIHJhbmdlOiBAX3JhbmdlXG5cbiAgX2dvdFJlc3VsdDogKHJlc3VsdCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIHJlc3VsdD9cbiAgICBAX2NiLmNhbGwgQF9jYWxsZXIsIHJlc3VsdFxuXG4gIF9nb3RNZXNzYWdlOiAobXNnKSAtPlxuICAgIHJldHVybiB1bmxlc3MgbXNnPy5tP1xuXG4gICAgc3dpdGNoIG1zZy5tXG4gICAgICB3aGVuIFwicmVxdWVzdF9yYW5nZVwiIHRoZW4gQF9zZW5kUmFuZ2UoKVxuICAgICAgd2hlbiBcInJlc3VsdFwiIHRoZW4gQF9nb3RSZXN1bHQgbXNnLnJlc3VsdFxuICAgICAgd2hlbiBcImNvbnNvbGVfbG9nXCIgdGhlbiBjb25zb2xlLmxvZyBcIndvcmtlclwiLCBtc2cuZGF0YVxuXG4gIHNlbmREYXRhOiAoZGF0YSkgLT4gQF9zZW5kIG06IFwiZGF0YVwiLCBkYXRhOiBkYXRhXG5cbiAgc3RvcDogLT5cbiAgICByZXR1cm4gdW5sZXNzIEB3b3JrZXI/XG4gICAgQGRpc2Nvbm5lY3QoKVxuICAgIGRlbGV0ZSBAd29ya2VyXG4gICAgZGVsZXRlIEBzZW5kRm5cblxuY2xhc3MgTm9kZVRhc2tNYXN0ZXIgZXh0ZW5kcyAoVGFza01hc3RlcilcbiAgI0BNQVhfTlVNX1dPUktFUlMgICAgID0gaWYgb3MuY3B1cz8gdGhlbiBvcy5jcHVzKCkubGVuZ3RoIGVsc2UgNFxuICBATUFYX05VTV9XT1JLRVJTID0gOFxuICBAREVGQVVMVF9OVU1fV09SS0VSUyA9IEBNQVhfTlVNX1dPUktFUlNcblxuICBjb25zdHJ1Y3RvcjogKGNhbGxlciwgY2IsIHJhbmdlKSAtPlxuICAgIHN1cGVyIGNhbGxlciwgY2IsIHJhbmdlXG4gICAgcHJvcGVydGllcy5tYWtlUmVhZE9ubHkgdGhpc1xuXG4gIGNvbm5lY3Q6IC0+XG4gICAgY29uc29sZS5sb2cgXCJhZGRpbmcgd29ya2VyXCJcbiAgICBAd29ya2VyID0gY2hpbGRQcm9jZXNzLmZvcmsgX19kaXJuYW1lICsgXCIvd29ya2VyLmpzXCJcbiAgICBtZSA9IHRoaXNcbiAgICBAd29ya2VyLm9uIFwibWVzc2FnZVwiLCAoZGF0YSkgLT4gbWUuX2dvdE1lc3NhZ2UgZGF0YVxuICAgIHByb3BlcnRpZXMubWFrZVJlYWRPbmx5IEB3b3JrZXJcbiAgICBAc2VuZEZuID0gKGRhdGEpIC0+IEB3b3JrZXIuc2VuZCBkYXRhXG5cbiAgZGlzY29ubmVjdDogLT4gQHdvcmtlci5kaXNjb25uZWN0KClcblxuY2xhc3MgV2ViVGFza01hc3RlciBleHRlbmRzIChUYXNrTWFzdGVyKVxuICBATUFYX05VTV9XT1JLRVJTICAgICA9IDhcbiAgQERFRkFVTFRfTlVNX1dPUktFUlMgPSA0XG5cbiAgY29uc3RydWN0b3I6IChjYWxsZXIsIGNiLCByYW5nZSwgQGZpbGUpIC0+XG4gICAgc3VwZXIgY2FsbGVyLCBjYiwgcmFuZ2VcbiAgICBwcm9wZXJ0aWVzLm1ha2VSZWFkT25seSB0aGlzXG5cbiAgY29ubmVjdDogLT5cbiAgICBAd29ya2VyID0gbmV3IFdvcmtlciBAZmlsZVxuICAgIG1lID0gdGhpc1xuICAgIEB3b3JrZXIub25tZXNzYWdlID0gKGV2ZW50KSAtPiBtZS5fZ290TWVzc2FnZSBldmVudC5kYXRhXG4gICAgcHJvcGVydGllcy5tYWtlUmVhZE9ubHkgQHdvcmtlclxuICAgIEBzZW5kRm4gPSAoZGF0YSkgLT4gQHdvcmtlci5wb3N0TWVzc2FnZSBkYXRhXG5cbiAgZGlzY29ubmVjdDogLT4gQHdvcmtlci50ZXJtaW5hdGUoKVxuXG5jbGFzcyBUaW1lb3V0VGFza01hc3RlclxuICBATUFYX05VTV9XT1JLRVJTICAgICA9ICAxXG4gIEBERUZBVUxUX05VTV9XT1JLRVJTID0gIDFcblxuICBjb25zdHJ1Y3RvcjogKEBfY2FsbGVyLCBAX2NiKSAtPlxuICAgIHByb3BlcnRpZXMubWFrZVJlYWRPbmx5IHRoaXNcblxuICBzZW5kRGF0YTogKEBfZGF0YSkgLT5cbiAgICBkZWxldGUgQF9zdG9wRmxhZ1xuICAgIEBzdGFydCgpXG5cbiAgc3RhcnQ6IC0+XG4gICAgc3RhcnRUaW1lID0gbmV3IERhdGUoKVxuXG4gICAgdW50aWwgQF9zdG9wRmxhZz8gb3IgQF9kYXRhLnJlc3VsdD8gb3JcbiAgICAgICAgICAobmV3IERhdGUoKSAtIHN0YXJ0VGltZSA+PSBUSU1FT1VUX01BWF9SVU5USU1FKVxuICAgICAgc2hhMS50cnlDaGFsbGVuZ2UgQF9kYXRhXG5cbiAgICBpZiBAX3N0b3BGbGFnP1xuICAgICAgIyMgZG8gbm90aGluZ1xuICAgIGVsc2UgaWYgQF9kYXRhLnJlc3VsdD9cbiAgICAgIEBfY2IuY2FsbCBAX2NhbGxlciwgQF9kYXRhLnJlc3VsdFxuICAgIGVsc2VcbiAgICAgIG1lID0gdGhpc1xuICAgICAgc2V0VGltZW91dCAoIC0+IG1lLnN0YXJ0KCkpLCBUSU1FT1VUX1lJRUxEX1RJTUVcblxuICBzdG9wOiAtPiBAX3N0b3BGbGFnID0gdHJ1ZVxuXG5wcm9wZXJ0aWVzLm1ha2VSZWFkT25seSB0eXBlIGZvciB0eXBlIGluIFtcbiAgVGFza01hc3RlcixcbiAgVGFza01hc3Rlcjo6LFxuICBOb2RlVGFza01hc3RlcixcbiAgTm9kZVRhc2tNYXN0ZXI6OixcbiAgV2ViVGFza01hc3RlcixcbiAgV2ViVGFza01hc3Rlcjo6LFxuICBUaW1lb3V0VGFza01hc3RlcixcbiAgVGltZW91dFRhc2tNYXN0ZXI6OlxuXVxuXG5leHBvcnRzLk5vZGVUYXNrTWFzdGVyICAgID0gTm9kZVRhc2tNYXN0ZXJcbmV4cG9ydHMuV2ViVGFza01hc3RlciAgICAgPSBXZWJUYXNrTWFzdGVyXG5leHBvcnRzLlRpbWVvdXRUYXNrTWFzdGVyID0gVGltZW91dFRhc2tNYXN0ZXJcbiJdfQ==
;