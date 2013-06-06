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

(function(e){if("function"==typeof bootstrap)bootstrap("hashcash",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeHashCash=e}else"undefined"!=typeof window?window.HashCash=e():global.HashCash=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function() {
  var HashCash, HashCashImpl, NodeTaskMaster, TimeoutTaskMaster, WebTaskMaster, properties, sha1, taskmaster, type, _buildDate, _date, _generate, _i, _j, _len, _len1, _nextPos, _parse, _ref, _ref1, _resetRange, _sendData, _stop, _unparse, _validate, _workerCallback, _workerGenerator;

  sha1 = require("./sha1");

  taskmaster = require("./taskmaster");

  properties = require("./properties");

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

  _date = function() {
    var dd, mm, now, yy;
    now = new Date();
    yy = ("0" + (now.getYear() - 100)).slice(-2);
    mm = ('0' + (now.getMonth() + 1)).slice(-2);
    dd = ('0' + now.getDate()).slice(-2);
    return "" + yy + mm + dd;
  };

  _parse = function(str) {
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

  _unparse = function(parts) {
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

  _resetRange = function() {
    return this._range = {
      begin: 0,
      end: -1
    };
  };

  _workerCallback = function(result) {
    this.stop();
    if (this._callbackScope != null) {
      return this._callback.call(this._callbackScope, result);
    } else {
      return this._callback(result);
    }
  };

  _workerGenerator = function(type) {
    var num, numWorkers, worker;
    if (this._workers.length) {
      return;
    }
    if (this._numWorkers != null) {
      numWorkers = Math.min(this._numWorkers, type.MAX_NUM_WORKERS);
    } else {
      numWorkers = type.DEFAULT_NUM_WORKERS;
    }
    if (!numWorkers) {
      return;
    }
    console.log("using " + numWorkers + " workers");
    return this._workers = (function() {
      var _i, _results;
      _results = [];
      for (num = _i = 1; 1 <= numWorkers ? _i <= numWorkers : _i >= numWorkers; num = 1 <= numWorkers ? ++_i : --_i) {
        worker = new type(this, this._workerCallback, this._range, this._workerFile);
        properties.makeReadOnly(worker);
        _results.push(worker);
      }
      return _results;
    }).call(this);
  };

  _sendData = function(data) {
    var worker, _i, _len, _ref, _results;
    _ref = this._workers;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      worker = _ref[_i];
      _results.push(worker.sendData(data));
    }
    return _results;
  };

  _stop = function() {
    var worker, _i, _len, _ref, _results;
    _ref = this._workers;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      worker = _ref[_i];
      _results.push(worker.stop());
    }
    return _results;
  };

  _generate = function(resource) {
    var data, parts, type;
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
    /*
    Use different strategies to ensure the main javascript thread is not
    hung up while generating the hashcash
    
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

  _validate = function(str) {
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

  HashCashImpl = (function() {
    function HashCashImpl(_bits, _callback, _callbackScope, _workerFile, _numWorkers) {
      this._bits = _bits;
      this._callback = _callback;
      this._callbackScope = _callbackScope;
      this._workerFile = _workerFile;
      this._numWorkers = _numWorkers;
      if (this._bits < HashCash.MIN_BITS) {
        this._bits = HashCash.MIN_BITS;
      }
      this._workers = [];
      this._range = {};
      properties.makeHidden(this);
    }

    HashCashImpl.prototype._resetRange = function() {
      return _resetRange.apply(this, arguments);
    };

    HashCashImpl.prototype._workerCallback = function() {
      return _workerCallback.apply(this, arguments);
    };

    HashCashImpl.prototype._workerGenerator = function() {
      return _workerGenerator.apply(this, arguments);
    };

    HashCashImpl.prototype._sendData = function() {
      return _sendData.apply(this, arguments);
    };

    HashCashImpl.prototype.stop = function() {
      return _stop.apply(this, arguments);
    };

    HashCashImpl.prototype.generate = function() {
      return _generate.apply(this, arguments);
    };

    HashCashImpl.prototype.validate = function() {
      return _validate.apply(this, arguments);
    };

    return HashCashImpl;

  })();

  _ref = [HashCashImpl, HashCashImpl.prototype];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    type = _ref[_i];
    properties.makeReadOnly(type);
  }

  HashCash = (function() {
    HashCash.VERSION = 1;

    HashCash.MIN_BITS = 16;

    HashCash.hash = sha1;

    HashCash.date = function() {
      return _date.apply(this, arguments);
    };

    HashCash.parse = function(str) {
      return _parse.apply(this, arguments);
    };

    HashCash.unparse = function(parts) {
      return _unparse.apply(this, arguments);
    };

    function HashCash(bits, callback, callbackScope, workerFile, numWorkers) {
      this._impl = new HashCashImpl(bits, callback, callbackScope, workerFile, numWorkers);
      properties.makeReadOnly(this._impl);
      properties.makeReadOnly(this);
    }

    HashCash.prototype.stop = function() {
      return this._impl.stop.apply(this._impl, arguments);
    };

    HashCash.prototype.generate = function(resource) {
      return this._impl.generate.apply(this._impl, arguments);
    };

    HashCash.prototype.validate = function(str) {
      return this._impl.validate.apply(this._impl, arguments);
    };

    return HashCash;

  })();

  _ref1 = [HashCash, HashCash.prototype];
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    type = _ref1[_j];
    properties.makeReadOnly(type);
  }

  module.exports = HashCash;

}).call(this);

},{"./sha1":2,"./taskmaster":3,"./properties":4}],2:[function(require,module,exports){
(function() {
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

},{}],4:[function(require,module,exports){
(function() {
  var HIDDEN, HIDDEN_READ_ONLY, READ_ONLY,
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

  HIDDEN = {
    writable: true,
    enumerable: false,
    configurable: false
  };

  exports.makeReadOnly = function(type) {
    var key, mode;
    if (Object.defineProperty == null) {
      return void 0;
    }
    for (key in type) {
      if (!__hasProp.call(type, key)) continue;
      mode = READ_ONLY;
      if (key[0] === '_') {
        mode = HIDDEN_READ_ONLY;
      }
      Object.defineProperty(type, key, mode);
    }
    return void 0;
  };

  exports.makeHidden = function(type) {
    var key, mode;
    if (Object.defineProperty == null) {
      return void 0;
    }
    for (key in type) {
      if (!__hasProp.call(type, key)) continue;
      if (key[0] === '_') {
        mode = HIDDEN;
        if (typeof type[key] === "function") {
          mode = HIDDEN_READ_ONLY;
        }
      } else if (typeof type[key] === "function") {
        mode = READ_ONLY;
      }
      if (mode == null) {
        continue;
      }
      Object.defineProperty(type, key, mode);
      mode = void 0;
    }
    return void 0;
  };

}).call(this);

},{}],5:[function(require,module,exports){

},{}],6:[function(require,module,exports){
exports.spawn = function () {};
exports.exec = function () {};

},{}],3:[function(require,module,exports){
(function(__dirname){(function() {
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

})("/")
},{"os":5,"child_process":6,"./sha1":2,"./properties":4}]},{},[1])(1)
});
;