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
