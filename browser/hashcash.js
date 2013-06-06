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
  var HashCash, NodeTaskMaster, TimeoutTaskMaster, WebTaskMaster, properties, sha1, _buildDate, _nextPos, _ref;

  sha1 = require("./sha1");

  properties = require("./properties");

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
},{"./sha1":3,"./properties":4,"./taskmaster":5}],4:[function(require,module,exports){
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

/*
//@ sourceMappingURL=properties.js.map
*/
},{}],3:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
exports.spawn = function () {};
exports.exec = function () {};

},{}],5:[function(require,module,exports){
(function(__dirname){(function() {
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
})("/")
},{"child_process":6,"./sha1":3,"./properties":4}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvanJ1YmluL3dvcmtpbmcvcHJlY2lzZS9ub2RlLWhhc2hjYXNoL2xpYi9icm93c2VyLmpzIiwiL1VzZXJzL2pydWJpbi93b3JraW5nL3ByZWNpc2Uvbm9kZS1oYXNoY2FzaC9saWIvaGFzaGNhc2guanMiLCIvVXNlcnMvanJ1YmluL3dvcmtpbmcvcHJlY2lzZS9ub2RlLWhhc2hjYXNoL2xpYi9wcm9wZXJ0aWVzLmpzIiwiL1VzZXJzL2pydWJpbi93b3JraW5nL3ByZWNpc2Uvbm9kZS1oYXNoY2FzaC9saWIvc2hhMS5qcyIsIi9Vc2Vycy9qcnViaW4vd29ya2luZy9wcmVjaXNlL25vZGUtaGFzaGNhc2gvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9idWlsdGluL2NoaWxkX3Byb2Nlc3MuanMiLCIvVXNlcnMvanJ1YmluL3dvcmtpbmcvcHJlY2lzZS9ub2RlLWhhc2hjYXNoL2xpYi90YXNrbWFzdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgd2luZG93Lkhhc2hDYXNoID0gcmVxdWlyZShcIi4vaGFzaGNhc2hcIik7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8qXG4vL0Agc291cmNlTWFwcGluZ1VSTD1icm93c2VyLmpzLm1hcFxuKi8iLCIoZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgSGFzaENhc2gsIE5vZGVUYXNrTWFzdGVyLCBUaW1lb3V0VGFza01hc3RlciwgV2ViVGFza01hc3RlciwgcHJvcGVydGllcywgc2hhMSwgX2J1aWxkRGF0ZSwgX25leHRQb3MsIF9yZWY7XG5cbiAgc2hhMSA9IHJlcXVpcmUoXCIuL3NoYTFcIik7XG5cbiAgcHJvcGVydGllcyA9IHJlcXVpcmUoXCIuL3Byb3BlcnRpZXNcIik7XG5cbiAgX3JlZiA9IHJlcXVpcmUoXCIuL3Rhc2ttYXN0ZXJcIiksIE5vZGVUYXNrTWFzdGVyID0gX3JlZi5Ob2RlVGFza01hc3RlciwgV2ViVGFza01hc3RlciA9IF9yZWYuV2ViVGFza01hc3RlciwgVGltZW91dFRhc2tNYXN0ZXIgPSBfcmVmLlRpbWVvdXRUYXNrTWFzdGVyO1xuXG4gIF9idWlsZERhdGUgPSBmdW5jdGlvbihkYXRlKSB7XG4gICAgaWYgKHR5cGVvZiBkYXRlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBpZiAoZGF0ZS5sZW5ndGggIT09IDYpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGF0ZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkYXRlICE9PSBcIm51bWJlclwiKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIF9idWlsZERhdGUoXCJcIiArIGRhdGUpO1xuICB9O1xuXG4gIF9uZXh0UG9zID0gZnVuY3Rpb24oc3RyLCBwb3MpIHtcbiAgICBwb3Muc3RhcnQgPSBwb3MuZW5kICsgMTtcbiAgICBpZiAocG9zLnN0YXJ0ID09PSBzdHIubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHBvcy5lbmQgPSBzdHIuaW5kZXhPZignOicsIHBvcy5zdGFydCk7XG4gICAgaWYgKHBvcy5lbmQgPT09IC0xKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChwb3MuZW5kID09PSBwb3Muc3RhcnQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgSGFzaENhc2ggPSAoZnVuY3Rpb24oKSB7XG4gICAgSGFzaENhc2guVkVSU0lPTiA9IDE7XG5cbiAgICBIYXNoQ2FzaC5NSU5fQklUUyA9IDE2O1xuXG4gICAgSGFzaENhc2guaGFzaCA9IHNoYTE7XG5cbiAgICBIYXNoQ2FzaC5kYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZGQsIG1tLCBub3csIHl5O1xuICAgICAgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgIHl5ID0gKFwiMFwiICsgKG5vdy5nZXRZZWFyKCkgLSAxMDApKS5zbGljZSgtMik7XG4gICAgICBtbSA9ICgnMCcgKyAobm93LmdldE1vbnRoKCkgKyAxKSkuc2xpY2UoLTIpO1xuICAgICAgZGQgPSAoJzAnICsgbm93LmdldERhdGUoKSkuc2xpY2UoLTIpO1xuICAgICAgcmV0dXJuIFwiXCIgKyB5eSArIG1tICsgZGQ7XG4gICAgfTtcblxuICAgIEhhc2hDYXNoLnBhcnNlID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgICB2YXIgY291bnRlckVuZCwgZGF0YSwgcG9zO1xuICAgICAgaWYgKHN0ciA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgZGF0YSA9IHt9O1xuICAgICAgcG9zID0ge1xuICAgICAgICBzdGFydDogMCxcbiAgICAgICAgZW5kOiAtMSxcbiAgICAgICAgbGVuZ3RoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5lbmQgLSB0aGlzLnN0YXJ0O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgaWYgKCFfbmV4dFBvcyhzdHIsIHBvcykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBkYXRhLnZlcnNpb24gPSBwYXJzZUludChzdHIuc3Vic3RyKHBvcy5zdGFydCwgcG9zLmxlbmd0aCgpKSwgMTApO1xuICAgICAgaWYgKGlzTmFOKGRhdGEudmVyc2lvbikpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBpZiAoIV9uZXh0UG9zKHN0ciwgcG9zKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGRhdGEuYml0cyA9IHBhcnNlSW50KHN0ci5zdWJzdHIocG9zLnN0YXJ0LCBwb3MubGVuZ3RoKCkpLCAxMCk7XG4gICAgICBpZiAoaXNOYU4oZGF0YS5iaXRzKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICghX25leHRQb3Moc3RyLCBwb3MpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgZGF0YS5kYXRlID0gcGFyc2VJbnQoc3RyLnN1YnN0cihwb3Muc3RhcnQsIHBvcy5sZW5ndGgoKSksIDEwKTtcbiAgICAgIGlmIChpc05hTihkYXRhLmRhdGUpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKCFfbmV4dFBvcyhzdHIsIHBvcykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBkYXRhLnJlc291cmNlID0gc3RyLnN1YnN0cihwb3Muc3RhcnQsIHBvcy5sZW5ndGgoKSk7XG4gICAgICBpZiAoIWRhdGEucmVzb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKCFfbmV4dFBvcyhzdHIsIHBvcykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBkYXRhLnJhbmQgPSBzdHIuc3Vic3RyKHBvcy5zdGFydCwgcG9zLmxlbmd0aCgpKTtcbiAgICAgIGlmICghZGF0YS5yYW5kLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIF9uZXh0UG9zKHN0ciwgcG9zKTtcbiAgICAgIGNvdW50ZXJFbmQgPSAocG9zLmVuZCA9PT0gLTEgPyBzdHIubGVuZ3RoIDogcG9zLmVuZCkgLSBwb3Muc3RhcnQ7XG4gICAgICBkYXRhLmNvdW50ZXIgPSBwYXJzZUludChzdHIuc3Vic3RyKHBvcy5zdGFydCwgY291bnRlckVuZCksIDEwKTtcbiAgICAgIGlmIChpc05hTihkYXRhLmNvdW50ZXIpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfTtcblxuICAgIEhhc2hDYXNoLnVucGFyc2UgPSBmdW5jdGlvbihwYXJ0cykge1xuICAgICAgdmFyIGRhdGUsIHJldDtcbiAgICAgIHJldCA9IFwiXCI7XG4gICAgICBpZiAocGFydHMudmVyc2lvbiA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG4gICAgICByZXQgKz0gXCJcIiArIHBhcnRzLnZlcnNpb24gKyBcIjpcIjtcbiAgICAgIGlmIChwYXJ0cy5iaXRzID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgIH1cbiAgICAgIHJldCArPSBcIlwiICsgcGFydHMuYml0cyArIFwiOlwiO1xuICAgICAgaWYgKHBhcnRzLmRhdGUgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfVxuICAgICAgZGF0ZSA9IF9idWlsZERhdGUocGFydHMuZGF0ZSk7XG4gICAgICBpZiAoZGF0ZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG4gICAgICByZXQgKz0gXCJcIiArIGRhdGUgKyBcIjpcIjtcbiAgICAgIGlmIChwYXJ0cy5yZXNvdXJjZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG4gICAgICByZXQgKz0gXCJcIiArIHBhcnRzLnJlc291cmNlICsgXCI6XCI7XG4gICAgICBpZiAocGFydHMucmFuZCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgICB9XG4gICAgICByZXQgKz0gcGFydHMucmFuZDtcbiAgICAgIGlmIChwYXJ0cy5jb3VudGVyID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgIH1cbiAgICAgIHJldCArPSBcIjpcIiArIHBhcnRzLmNvdW50ZXI7XG4gICAgICByZXR1cm4gcmV0O1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBIYXNoQ2FzaChfYml0cywgY2IsIGNhbGxlciwgd29ya2VyRmlsZSwgbnVtV29ya2Vycykge1xuICAgICAgdmFyIG51bSwgdHlwZSwgd29ya2VyLCB3cmFwcGVkQ2I7XG4gICAgICB0aGlzLl9iaXRzID0gX2JpdHM7XG4gICAgICBpZiAodGhpcy5fYml0cyA8IEhhc2hDYXNoLk1JTl9CSVRTKSB7XG4gICAgICAgIHRoaXMuX2JpdHMgPSBIYXNoQ2FzaC5NSU5fQklUUztcbiAgICAgIH1cbiAgICAgIHRoaXMuX3dvcmtlcnMgPSBbXTtcbiAgICAgIHRoaXMuX3JhbmdlID0ge307XG4gICAgICB0aGlzLl9yZXNldFJhbmdlKCk7XG4gICAgICAvKlxuICAgICAgVXNlIGRpZmZlcmVudCBzdHJhdGVnaWVzIHRvIGVuc3VyZSB0aGUgbWFpbiBqYXZhc2NyaXB0IHRocmVhZCBpcyBub3RcbiAgICAgIGh1bmcgdXAgd2hpbGUgZ2VuZXJhdGluZyB0aGUgaGFzaGNhc2hcbiAgICAgIFxuICAgICAgMS4gVW5kZXIgTm9kZSwgd2UgdXNlIGNoaWxkX3Byb2Nlc3NcbiAgICAgIDIuIEluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBpdCwgdXNlIHdlYiB3b3JrZXJzXG4gICAgICAzLiBJbiBvdGhlciBicm93c2VycywgdXNlIHNldFRpbWVvdXRcbiAgICAgICovXG5cbiAgICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSBcInVuZGVmaW5lZFwiIHx8IHdpbmRvdyA9PT0gbnVsbCkge1xuICAgICAgICB0eXBlID0gTm9kZVRhc2tNYXN0ZXI7XG4gICAgICB9IGVsc2UgaWYgKCh0eXBlb2YgV29ya2VyICE9PSBcInVuZGVmaW5lZFwiICYmIFdvcmtlciAhPT0gbnVsbCkgJiYgKHdvcmtlckZpbGUgIT0gbnVsbCkpIHtcbiAgICAgICAgdHlwZSA9IFdlYlRhc2tNYXN0ZXI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0eXBlID0gVGltZW91dFRhc2tNYXN0ZXI7XG4gICAgICB9XG4gICAgICBpZiAobnVtV29ya2VycyAhPSBudWxsKSB7XG4gICAgICAgIG51bVdvcmtlcnMgPSBNYXRoLm1pbihudW1Xb3JrZXJzLCB0eXBlLk1BWF9OVU1fV09SS0VSUyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBudW1Xb3JrZXJzID0gdHlwZS5ERUZBVUxUX05VTV9XT1JLRVJTO1xuICAgICAgfVxuICAgICAgaWYgKCFudW1Xb3JrZXJzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKFwidXNpbmcgXCIgKyBudW1Xb3JrZXJzICsgXCIgd29ya2Vyc1wiKTtcbiAgICAgIHdyYXBwZWRDYiA9IGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICAgICAgaWYgKGNhbGxlciAhPSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIGNiLmNhbGwoY2FsbGVyLCByZXN1bHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBjYihyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdGhpcy5fd29ya2VycyA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIF9pLCBfcmVzdWx0cztcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChudW0gPSBfaSA9IDE7IDEgPD0gbnVtV29ya2VycyA/IF9pIDw9IG51bVdvcmtlcnMgOiBfaSA+PSBudW1Xb3JrZXJzOyBudW0gPSAxIDw9IG51bVdvcmtlcnMgPyArK19pIDogLS1faSkge1xuICAgICAgICAgIHdvcmtlciA9IG5ldyB0eXBlKHRoaXMsIHdyYXBwZWRDYiwgdGhpcy5fcmFuZ2UsIHdvcmtlckZpbGUpO1xuICAgICAgICAgIF9yZXN1bHRzLnB1c2god29ya2VyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9KS5jYWxsKHRoaXMpO1xuICAgIH1cblxuICAgIEhhc2hDYXNoLnByb3RvdHlwZS5fcmVzZXRSYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3JhbmdlID0ge1xuICAgICAgICBiZWdpbjogMCxcbiAgICAgICAgZW5kOiAtMVxuICAgICAgfTtcbiAgICB9O1xuXG4gICAgSGFzaENhc2gucHJvdG90eXBlLl9zZW5kRGF0YSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHZhciB3b3JrZXIsIF9pLCBfbGVuLCBfcmVmMSwgX3Jlc3VsdHM7XG4gICAgICBfcmVmMSA9IHRoaXMuX3dvcmtlcnM7XG4gICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmMS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICB3b3JrZXIgPSBfcmVmMVtfaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2god29ya2VyLnNlbmREYXRhKGRhdGEpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICB9O1xuXG4gICAgSGFzaENhc2gucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB3b3JrZXIsIF9pLCBfbGVuLCBfcmVmMSwgX3Jlc3VsdHM7XG4gICAgICBfcmVmMSA9IHRoaXMuX3dvcmtlcnM7XG4gICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmMS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICB3b3JrZXIgPSBfcmVmMVtfaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2god29ya2VyLnN0b3AoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgfTtcblxuICAgIEhhc2hDYXNoLnByb3RvdHlwZS5nZW5lcmF0ZSA9IGZ1bmN0aW9uKHJlc291cmNlKSB7XG4gICAgICB2YXIgZGF0YSwgcGFydHM7XG4gICAgICB0aGlzLl9yZXNldFJhbmdlKCk7XG4gICAgICBwYXJ0cyA9IHtcbiAgICAgICAgdmVyc2lvbjogSGFzaENhc2guVkVSU0lPTixcbiAgICAgICAgYml0czogdGhpcy5fYml0cyxcbiAgICAgICAgZGF0ZTogSGFzaENhc2guZGF0ZSgpLFxuICAgICAgICByZXNvdXJjZTogcmVzb3VyY2UsXG4gICAgICAgIHJhbmQ6IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cigyKVxuICAgICAgfTtcbiAgICAgIGRhdGEgPSB7XG4gICAgICAgIGNoYWxsZW5nZTogSGFzaENhc2gudW5wYXJzZShwYXJ0cyksXG4gICAgICAgIGNvdW50ZXI6IDAsXG4gICAgICAgIGJpdHM6IHBhcnRzLmJpdHNcbiAgICAgIH07XG4gICAgICByZXR1cm4gdGhpcy5fc2VuZERhdGEoZGF0YSk7XG4gICAgfTtcblxuICAgIEhhc2hDYXNoLnByb3RvdHlwZS52YWxpZGF0ZSA9IGZ1bmN0aW9uKHN0cikge1xuICAgICAgdmFyIGRhdGEsIG5vdztcbiAgICAgIGlmIChzdHIgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fYml0cyA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGRhdGEgPSBIYXNoQ2FzaC5wYXJzZShzdHIpO1xuICAgICAgaWYgKGRhdGEgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoZGF0YS5iaXRzIDwgdGhpcy5fYml0cykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoZGF0YS5iaXRzIDwgSGFzaENhc2guTUlOX0JJVFMpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKGRhdGEudmVyc2lvbiAhPT0gSGFzaENhc2guVkVSU0lPTikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBub3cgPSBIYXNoQ2FzaC5kYXRlKCk7XG4gICAgICBpZiAoZGF0YS5kYXRlIDwgbm93IC0gMSB8fCBkYXRhLmRhdGUgPiBub3cgKyAxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzaGExLmxlYWRpbmcwcyhIYXNoQ2FzaC5oYXNoKHN0cikpID49IGRhdGEuYml0cztcbiAgICB9O1xuXG4gICAgcmV0dXJuIEhhc2hDYXNoO1xuXG4gIH0pKCk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBIYXNoQ2FzaDtcblxufSkuY2FsbCh0aGlzKTtcblxuLypcbi8vQCBzb3VyY2VNYXBwaW5nVVJMPWhhc2hjYXNoLmpzLm1hcFxuKi8iLCIoZnVuY3Rpb24oKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuICB2YXIgSElEREVOX1JFQURfT05MWSwgUkVBRF9PTkxZLFxuICAgIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIFJFQURfT05MWSA9IHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlXG4gIH07XG5cbiAgSElEREVOX1JFQURfT05MWSA9IHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZVxuICB9O1xuXG4gIGV4cG9ydHMubWFrZVJlYWRPbmx5ID0gZnVuY3Rpb24odHlwZSkge1xuICAgIHZhciBrZXksIF9yZXN1bHRzO1xuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkgIT0gbnVsbCkge1xuICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAoa2V5IGluIHR5cGUpIHtcbiAgICAgICAgaWYgKCFfX2hhc1Byb3AuY2FsbCh0eXBlLCBrZXkpKSBjb250aW51ZTtcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgJiYga2V5WzBdID09PSAnXycpIHtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBrZXksIHtcbiAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlXG4gICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgfVxuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vKlxuLy9AIHNvdXJjZU1hcHBpbmdVUkw9cHJvcGVydGllcy5qcy5tYXBcbiovIiwiKGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIFJPVEwsIGYsIGhpZGRlbiwga2V5LCBzaGExLCB0b0hleFN0ciwgX2xlYWRpbmcwcywgX3NoYTFoYXNoLCBfdHJ5Q2hhbGxlbmdlLFxuICAgIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIFJPVEwgPSBmdW5jdGlvbih4LCBuKSB7XG4gICAgcmV0dXJuICh4IDw8IG4pIHwgKHggPj4+ICgzMiAtIG4pKTtcbiAgfTtcblxuICB0b0hleFN0ciA9IGZ1bmN0aW9uKG4pIHtcbiAgICB2YXIgaSwgcywgdiwgX2k7XG4gICAgcyA9IFwiXCI7XG4gICAgZm9yIChpID0gX2kgPSA3OyBfaSA+PSAwOyBpID0gLS1faSkge1xuICAgICAgdiA9IChuID4+PiAoaSAqIDQpKSAmIDB4ZjtcbiAgICAgIHMgKz0gdi50b1N0cmluZygxNik7XG4gICAgfVxuICAgIHJldHVybiBzO1xuICB9O1xuXG4gIGYgPSBmdW5jdGlvbihzLCB4LCB5LCB6KSB7XG4gICAgc3dpdGNoIChzKSB7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIHJldHVybiAoeCAmIHkpIF4gKH54ICYgeik7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIHJldHVybiB4IF4geSBeIHo7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIHJldHVybiAoeCAmIHkpIF4gKHggJiB6KSBeICh5ICYgeik7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIHJldHVybiB4IF4geSBeIHo7XG4gICAgfVxuICB9O1xuXG4gIF9zaGExaGFzaCA9IGZ1bmN0aW9uKG1zZykge1xuICAgIHZhciBIMCwgSDEsIEgyLCBIMywgSDQsIEssIE0sIE4sIFQsIFRXT19UT19USElSVFlfVFdPLCBXLCBhLCBiLCBjLCBkLCBlLCBpLCBqLCBsLCBzLCB0LCBfaSwgX2osIF9rLCBfbCwgX20sIF9uLCBfcmVmLCBfcmVmMTtcbiAgICBLID0gWzB4NWE4Mjc5OTksIDB4NmVkOWViYTEsIDB4OGYxYmJjZGMsIDB4Y2E2MmMxZDZdO1xuICAgIG1zZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4ODApO1xuICAgIGwgPSBtc2cubGVuZ3RoIC8gNCArIDI7XG4gICAgTiA9IE1hdGguY2VpbChsIC8gMTYpO1xuICAgIE0gPSBbXTtcbiAgICBmb3IgKGkgPSBfaSA9IDAsIF9yZWYgPSBOIC0gMTsgMCA8PSBfcmVmID8gX2kgPD0gX3JlZiA6IF9pID49IF9yZWY7IGkgPSAwIDw9IF9yZWYgPyArK19pIDogLS1faSkge1xuICAgICAgTVtpXSA9IFtdO1xuICAgICAgZm9yIChqID0gX2ogPSAwOyBfaiA8PSAxNTsgaiA9ICsrX2opIHtcbiAgICAgICAgTVtpXVtqXSA9IChtc2cuY2hhckNvZGVBdChpICogNjQgKyBqICogNCArIDApIDw8IDI0KSB8IChtc2cuY2hhckNvZGVBdChpICogNjQgKyBqICogNCArIDEpIDw8IDE2KSB8IChtc2cuY2hhckNvZGVBdChpICogNjQgKyBqICogNCArIDIpIDw8IDgpIHwgKG1zZy5jaGFyQ29kZUF0KGkgKiA2NCArIGogKiA0ICsgMykgPDwgMCk7XG4gICAgICB9XG4gICAgfVxuICAgIFRXT19UT19USElSVFlfVFdPID0gNDI5NDk2NzI5NjtcbiAgICBNW04gLSAxXVsxNF0gPSAoKG1zZy5sZW5ndGggLSAxKSAqIDgpIC8gVFdPX1RPX1RISVJUWV9UV087XG4gICAgTVtOIC0gMV1bMTRdID0gTWF0aC5mbG9vcihNW04gLSAxXVsxNF0pO1xuICAgIE1bTiAtIDFdWzE1XSA9ICgobXNnLmxlbmd0aCAtIDEpICogOCkgJiAweGZmZmZmZmZmO1xuICAgIEgwID0gMHg2NzQ1MjMwMTtcbiAgICBIMSA9IDB4ZWZjZGFiODk7XG4gICAgSDIgPSAweDk4YmFkY2ZlO1xuICAgIEgzID0gMHgxMDMyNTQ3NjtcbiAgICBINCA9IDB4YzNkMmUxZjA7XG4gICAgVyA9IFtdO1xuICAgIGZvciAoaSA9IF9rID0gMCwgX3JlZjEgPSBOIC0gMTsgMCA8PSBfcmVmMSA/IF9rIDw9IF9yZWYxIDogX2sgPj0gX3JlZjE7IGkgPSAwIDw9IF9yZWYxID8gKytfayA6IC0tX2spIHtcbiAgICAgIGZvciAodCA9IF9sID0gMDsgX2wgPD0gMTU7IHQgPSArK19sKSB7XG4gICAgICAgIFdbdF0gPSBNW2ldW3RdO1xuICAgICAgfVxuICAgICAgZm9yICh0ID0gX20gPSAxNjsgX20gPD0gNzk7IHQgPSArK19tKSB7XG4gICAgICAgIFdbdF0gPSBST1RMKFdbdCAtIDNdIF4gV1t0IC0gOF0gXiBXW3QgLSAxNF0gXiBXW3QgLSAxNl0sIDEpO1xuICAgICAgfVxuICAgICAgYSA9IEgwO1xuICAgICAgYiA9IEgxO1xuICAgICAgYyA9IEgyO1xuICAgICAgZCA9IEgzO1xuICAgICAgZSA9IEg0O1xuICAgICAgZm9yICh0ID0gX24gPSAwOyBfbiA8PSA3OTsgdCA9ICsrX24pIHtcbiAgICAgICAgcyA9IE1hdGguZmxvb3IodCAvIDIwKTtcbiAgICAgICAgVCA9IChST1RMKGEsIDUpICsgZihzLCBiLCBjLCBkKSArIGUgKyBLW3NdICsgV1t0XSkgJiAweGZmZmZmZmZmO1xuICAgICAgICBlID0gZDtcbiAgICAgICAgZCA9IGM7XG4gICAgICAgIGMgPSBST1RMKGIsIDMwKTtcbiAgICAgICAgYiA9IGE7XG4gICAgICAgIGEgPSBUO1xuICAgICAgfVxuICAgICAgSDAgPSAoSDAgKyBhKSAmIDB4ZmZmZmZmZmY7XG4gICAgICBIMSA9IChIMSArIGIpICYgMHhmZmZmZmZmZjtcbiAgICAgIEgyID0gKEgyICsgYykgJiAweGZmZmZmZmZmO1xuICAgICAgSDMgPSAoSDMgKyBkKSAmIDB4ZmZmZmZmZmY7XG4gICAgICBINCA9IChINCArIGUpICYgMHhmZmZmZmZmZjtcbiAgICB9XG4gICAgcmV0dXJuIHRvSGV4U3RyKEgwKSArIHRvSGV4U3RyKEgxKSArIHRvSGV4U3RyKEgyKSArIHRvSGV4U3RyKEgzKSArIHRvSGV4U3RyKEg0KTtcbiAgfTtcblxuICBfbGVhZGluZzBzID0gZnVuY3Rpb24oaGV4U3RyKSB7XG4gICAgdmFyIGN1ck51bSwgbnVtLCBwb3MsIF9pLCBfcmVmO1xuICAgIG51bSA9IDA7XG4gICAgZm9yIChwb3MgPSBfaSA9IDAsIF9yZWYgPSBoZXhTdHIubGVuZ3RoIC0gMTsgMCA8PSBfcmVmID8gX2kgPD0gX3JlZiA6IF9pID49IF9yZWY7IHBvcyA9IDAgPD0gX3JlZiA/ICsrX2kgOiAtLV9pKSB7XG4gICAgICBjdXJOdW0gPSBwYXJzZUludChoZXhTdHJbcG9zXSwgMTYpO1xuICAgICAgaWYgKGlzTmFOKGN1ck51bSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKGN1ck51bSkge1xuICAgICAgICBjYXNlIDB4MDpcbiAgICAgICAgICBudW0gKz0gNDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAweDE6XG4gICAgICAgICAgcmV0dXJuIG51bSArIDM7XG4gICAgICAgIGNhc2UgMHgyOlxuICAgICAgICBjYXNlIDB4MzpcbiAgICAgICAgICByZXR1cm4gbnVtICsgMjtcbiAgICAgICAgY2FzZSAweDQ6XG4gICAgICAgIGNhc2UgMHg1OlxuICAgICAgICBjYXNlIDB4NjpcbiAgICAgICAgY2FzZSAweDc6XG4gICAgICAgICAgcmV0dXJuIG51bSArIDE7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIG51bTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bTtcbiAgfTtcblxuICBfdHJ5Q2hhbGxlbmdlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBjaGFsbGVuZ2UsIHNoYTtcbiAgICBjaGFsbGVuZ2UgPSBcIlwiICsgZGF0YS5jaGFsbGVuZ2UgKyBcIjpcIiArIGRhdGEuY291bnRlcjtcbiAgICBzaGEgPSBfc2hhMWhhc2goY2hhbGxlbmdlKTtcbiAgICBpZiAoX2xlYWRpbmcwcyhzaGEpID49IGRhdGEuYml0cykge1xuICAgICAgZGF0YS5yZXN1bHQgPSBjaGFsbGVuZ2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZGF0YS5jb3VudGVyICs9IDE7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIHNoYTEgPSBmdW5jdGlvbihtc2cpIHtcbiAgICByZXR1cm4gX3NoYTFoYXNoKG1zZyk7XG4gIH07XG5cbiAgc2hhMS5sZWFkaW5nMHMgPSBmdW5jdGlvbihoZXhTdHIpIHtcbiAgICByZXR1cm4gX2xlYWRpbmcwcyhoZXhTdHIpO1xuICB9O1xuXG4gIHNoYTEudHJ5Q2hhbGxlbmdlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHJldHVybiBfdHJ5Q2hhbGxlbmdlKGRhdGEpO1xuICB9O1xuXG4gIGhpZGRlbiA9IHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZVxuICB9O1xuXG4gIGZvciAoa2V5IGluIHNoYTEpIHtcbiAgICBpZiAoIV9faGFzUHJvcC5jYWxsKHNoYTEsIGtleSkpIGNvbnRpbnVlO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzaGExLCBrZXksIGhpZGRlbik7XG4gIH1cblxuICBtb2R1bGUuZXhwb3J0cyA9IHNoYTE7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8qXG4vL0Agc291cmNlTWFwcGluZ1VSTD1zaGExLmpzLm1hcFxuKi8iLCJleHBvcnRzLnNwYXduID0gZnVuY3Rpb24gKCkge307XG5leHBvcnRzLmV4ZWMgPSBmdW5jdGlvbiAoKSB7fTtcbiIsIihmdW5jdGlvbihfX2Rpcm5hbWUpeyhmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBOb2RlVGFza01hc3RlciwgVElNRU9VVF9NQVhfUlVOVElNRSwgVElNRU9VVF9ZSUVMRF9USU1FLCBUYXNrTWFzdGVyLCBUaW1lb3V0VGFza01hc3RlciwgV2ViVGFza01hc3RlciwgY2hpbGRQcm9jZXNzLCBwcm9wZXJ0aWVzLCBzaGExLCB0eXBlLCBfaSwgX2xlbiwgX3JlZixcbiAgICBfX2hhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eSxcbiAgICBfX2V4dGVuZHMgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKF9faGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfTtcblxuICBjaGlsZFByb2Nlc3MgPSByZXF1aXJlKFwiY2hpbGRfcHJvY2Vzc1wiKTtcblxuICBzaGExID0gcmVxdWlyZShcIi4vc2hhMVwiKTtcblxuICBwcm9wZXJ0aWVzID0gcmVxdWlyZShcIi4vcHJvcGVydGllc1wiKTtcblxuICBUSU1FT1VUX01BWF9SVU5USU1FID0gOTk7XG5cbiAgVElNRU9VVF9ZSUVMRF9USU1FID0gMTtcblxuICBUYXNrTWFzdGVyID0gKGZ1bmN0aW9uKCkge1xuICAgIFRhc2tNYXN0ZXIuUkFOR0VfSU5DUkVNRU5UID0gTWF0aC5wb3coMiwgMTUpO1xuXG4gICAgZnVuY3Rpb24gVGFza01hc3RlcihfY2FsbGVyLCBfY2IsIF9yYW5nZSkge1xuICAgICAgdGhpcy5fY2FsbGVyID0gX2NhbGxlcjtcbiAgICAgIHRoaXMuX2NiID0gX2NiO1xuICAgICAgdGhpcy5fcmFuZ2UgPSBfcmFuZ2U7XG4gICAgfVxuXG4gICAgVGFza01hc3Rlci5wcm90b3R5cGUuX3NlbmQgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICB0aGlzLl9zcGF3bigpO1xuICAgICAgaWYgKHRoaXMuc2VuZEZuID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuc2VuZEZuKGRhdGEpO1xuICAgIH07XG5cbiAgICBUYXNrTWFzdGVyLnByb3RvdHlwZS5fc3Bhd24gPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLndvcmtlciAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmNvbm5lY3QoKTtcbiAgICB9O1xuXG4gICAgVGFza01hc3Rlci5wcm90b3R5cGUuX2luY1JhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9yYW5nZS5iZWdpbiA9IHRoaXMuX3JhbmdlLmVuZCArIDE7XG4gICAgICByZXR1cm4gdGhpcy5fcmFuZ2UuZW5kID0gdGhpcy5fcmFuZ2UuYmVnaW4gKyBUYXNrTWFzdGVyLlJBTkdFX0lOQ1JFTUVOVCAtIDE7XG4gICAgfTtcblxuICAgIFRhc2tNYXN0ZXIucHJvdG90eXBlLl9zZW5kUmFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2luY1JhbmdlKCk7XG4gICAgICByZXR1cm4gdGhpcy5fc2VuZCh7XG4gICAgICAgIG06IFwicmFuZ2VcIixcbiAgICAgICAgcmFuZ2U6IHRoaXMuX3JhbmdlXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgVGFza01hc3Rlci5wcm90b3R5cGUuX2dvdFJlc3VsdCA9IGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgaWYgKHJlc3VsdCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl9jYi5jYWxsKHRoaXMuX2NhbGxlciwgcmVzdWx0KTtcbiAgICB9O1xuXG4gICAgVGFza01hc3Rlci5wcm90b3R5cGUuX2dvdE1lc3NhZ2UgPSBmdW5jdGlvbihtc2cpIHtcbiAgICAgIGlmICgobXNnICE9IG51bGwgPyBtc2cubSA6IHZvaWQgMCkgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKG1zZy5tKSB7XG4gICAgICAgIGNhc2UgXCJyZXF1ZXN0X3JhbmdlXCI6XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmRSYW5nZSgpO1xuICAgICAgICBjYXNlIFwicmVzdWx0XCI6XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2dvdFJlc3VsdChtc2cucmVzdWx0KTtcbiAgICAgICAgY2FzZSBcImNvbnNvbGVfbG9nXCI6XG4gICAgICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKFwid29ya2VyXCIsIG1zZy5kYXRhKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgVGFza01hc3Rlci5wcm90b3R5cGUuc2VuZERhdGEgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc2VuZCh7XG4gICAgICAgIG06IFwiZGF0YVwiLFxuICAgICAgICBkYXRhOiBkYXRhXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgVGFza01hc3Rlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMud29ya2VyID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICBkZWxldGUgdGhpcy53b3JrZXI7XG4gICAgICByZXR1cm4gZGVsZXRlIHRoaXMuc2VuZEZuO1xuICAgIH07XG5cbiAgICByZXR1cm4gVGFza01hc3RlcjtcblxuICB9KSgpO1xuXG4gIE5vZGVUYXNrTWFzdGVyID0gKGZ1bmN0aW9uKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhOb2RlVGFza01hc3RlciwgX3N1cGVyKTtcblxuICAgIE5vZGVUYXNrTWFzdGVyLk1BWF9OVU1fV09SS0VSUyA9IDg7XG5cbiAgICBOb2RlVGFza01hc3Rlci5ERUZBVUxUX05VTV9XT1JLRVJTID0gTm9kZVRhc2tNYXN0ZXIuTUFYX05VTV9XT1JLRVJTO1xuXG4gICAgZnVuY3Rpb24gTm9kZVRhc2tNYXN0ZXIoY2FsbGVyLCBjYiwgcmFuZ2UpIHtcbiAgICAgIE5vZGVUYXNrTWFzdGVyLl9fc3VwZXJfXy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIGNhbGxlciwgY2IsIHJhbmdlKTtcbiAgICAgIHByb3BlcnRpZXMubWFrZVJlYWRPbmx5KHRoaXMpO1xuICAgIH1cblxuICAgIE5vZGVUYXNrTWFzdGVyLnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbWU7XG4gICAgICB0aGlzLndvcmtlciA9IGNoaWxkUHJvY2Vzcy5mb3JrKF9fZGlybmFtZSArIFwiL3dvcmtlci5qc1wiKTtcbiAgICAgIG1lID0gdGhpcztcbiAgICAgIHRoaXMud29ya2VyLm9uKFwibWVzc2FnZVwiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHJldHVybiBtZS5fZ290TWVzc2FnZShkYXRhKTtcbiAgICAgIH0pO1xuICAgICAgcHJvcGVydGllcy5tYWtlUmVhZE9ubHkodGhpcy53b3JrZXIpO1xuICAgICAgcmV0dXJuIHRoaXMuc2VuZEZuID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICByZXR1cm4gdGhpcy53b3JrZXIuc2VuZChkYXRhKTtcbiAgICAgIH07XG4gICAgfTtcblxuICAgIE5vZGVUYXNrTWFzdGVyLnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy53b3JrZXIuZGlzY29ubmVjdCgpO1xuICAgIH07XG5cbiAgICByZXR1cm4gTm9kZVRhc2tNYXN0ZXI7XG5cbiAgfSkoVGFza01hc3Rlcik7XG5cbiAgV2ViVGFza01hc3RlciA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoV2ViVGFza01hc3RlciwgX3N1cGVyKTtcblxuICAgIFdlYlRhc2tNYXN0ZXIuTUFYX05VTV9XT1JLRVJTID0gODtcblxuICAgIFdlYlRhc2tNYXN0ZXIuREVGQVVMVF9OVU1fV09SS0VSUyA9IDQ7XG5cbiAgICBmdW5jdGlvbiBXZWJUYXNrTWFzdGVyKGNhbGxlciwgY2IsIHJhbmdlLCBmaWxlKSB7XG4gICAgICB0aGlzLmZpbGUgPSBmaWxlO1xuICAgICAgV2ViVGFza01hc3Rlci5fX3N1cGVyX18uY29uc3RydWN0b3IuY2FsbCh0aGlzLCBjYWxsZXIsIGNiLCByYW5nZSk7XG4gICAgICBwcm9wZXJ0aWVzLm1ha2VSZWFkT25seSh0aGlzKTtcbiAgICB9XG5cbiAgICBXZWJUYXNrTWFzdGVyLnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbWU7XG4gICAgICB0aGlzLndvcmtlciA9IG5ldyBXb3JrZXIodGhpcy5maWxlKTtcbiAgICAgIG1lID0gdGhpcztcbiAgICAgIHRoaXMud29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHJldHVybiBtZS5fZ290TWVzc2FnZShldmVudC5kYXRhKTtcbiAgICAgIH07XG4gICAgICBwcm9wZXJ0aWVzLm1ha2VSZWFkT25seSh0aGlzLndvcmtlcik7XG4gICAgICByZXR1cm4gdGhpcy5zZW5kRm4gPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHJldHVybiB0aGlzLndvcmtlci5wb3N0TWVzc2FnZShkYXRhKTtcbiAgICAgIH07XG4gICAgfTtcblxuICAgIFdlYlRhc2tNYXN0ZXIucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLndvcmtlci50ZXJtaW5hdGUoKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFdlYlRhc2tNYXN0ZXI7XG5cbiAgfSkoVGFza01hc3Rlcik7XG5cbiAgVGltZW91dFRhc2tNYXN0ZXIgPSAoZnVuY3Rpb24oKSB7XG4gICAgVGltZW91dFRhc2tNYXN0ZXIuTUFYX05VTV9XT1JLRVJTID0gMTtcblxuICAgIFRpbWVvdXRUYXNrTWFzdGVyLkRFRkFVTFRfTlVNX1dPUktFUlMgPSAxO1xuXG4gICAgZnVuY3Rpb24gVGltZW91dFRhc2tNYXN0ZXIoX2NhbGxlciwgX2NiKSB7XG4gICAgICB0aGlzLl9jYWxsZXIgPSBfY2FsbGVyO1xuICAgICAgdGhpcy5fY2IgPSBfY2I7XG4gICAgICBwcm9wZXJ0aWVzLm1ha2VSZWFkT25seSh0aGlzKTtcbiAgICB9XG5cbiAgICBUaW1lb3V0VGFza01hc3Rlci5wcm90b3R5cGUuc2VuZERhdGEgPSBmdW5jdGlvbihfZGF0YSkge1xuICAgICAgdGhpcy5fZGF0YSA9IF9kYXRhO1xuICAgICAgZGVsZXRlIHRoaXMuX3N0b3BGbGFnO1xuICAgICAgcmV0dXJuIHRoaXMuc3RhcnQoKTtcbiAgICB9O1xuXG4gICAgVGltZW91dFRhc2tNYXN0ZXIucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbWUsIHN0YXJ0VGltZTtcbiAgICAgIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG4gICAgICB3aGlsZSAoISgodGhpcy5fc3RvcEZsYWcgIT0gbnVsbCkgfHwgKHRoaXMuX2RhdGEucmVzdWx0ICE9IG51bGwpIHx8IChuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lID49IFRJTUVPVVRfTUFYX1JVTlRJTUUpKSkge1xuICAgICAgICBzaGExLnRyeUNoYWxsZW5nZSh0aGlzLl9kYXRhKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9zdG9wRmxhZyAhPSBudWxsKSB7XG5cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fZGF0YS5yZXN1bHQgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY2IuY2FsbCh0aGlzLl9jYWxsZXIsIHRoaXMuX2RhdGEucmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBtZS5zdGFydCgpO1xuICAgICAgICB9KSwgVElNRU9VVF9ZSUVMRF9USU1FKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgVGltZW91dFRhc2tNYXN0ZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zdG9wRmxhZyA9IHRydWU7XG4gICAgfTtcblxuICAgIHJldHVybiBUaW1lb3V0VGFza01hc3RlcjtcblxuICB9KSgpO1xuXG4gIF9yZWYgPSBbVGFza01hc3RlciwgVGFza01hc3Rlci5wcm90b3R5cGUsIE5vZGVUYXNrTWFzdGVyLCBOb2RlVGFza01hc3Rlci5wcm90b3R5cGUsIFdlYlRhc2tNYXN0ZXIsIFdlYlRhc2tNYXN0ZXIucHJvdG90eXBlLCBUaW1lb3V0VGFza01hc3RlciwgVGltZW91dFRhc2tNYXN0ZXIucHJvdG90eXBlXTtcbiAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgdHlwZSA9IF9yZWZbX2ldO1xuICAgIHByb3BlcnRpZXMubWFrZVJlYWRPbmx5KHR5cGUpO1xuICB9XG5cbiAgZXhwb3J0cy5Ob2RlVGFza01hc3RlciA9IE5vZGVUYXNrTWFzdGVyO1xuXG4gIGV4cG9ydHMuV2ViVGFza01hc3RlciA9IFdlYlRhc2tNYXN0ZXI7XG5cbiAgZXhwb3J0cy5UaW1lb3V0VGFza01hc3RlciA9IFRpbWVvdXRUYXNrTWFzdGVyO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vKlxuLy9AIHNvdXJjZU1hcHBpbmdVUkw9dGFza21hc3Rlci5qcy5tYXBcbiovXG59KShcIi9cIikiXX0=
;