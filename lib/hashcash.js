(function() {
  "use strict";
  define(["./sha1"], function(sha1) {
    var HashCash, _buildDate, _nextPos;
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
        var TaskMaster, num, wrappedCb;
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

        TaskMaster = HashCash.TaskMaster;
        if ((workerFile == null) && (HashCash.BackupTaskMaster != null)) {
          TaskMaster = HashCash.BackupTaskMaster;
        }
        if (numWorkers != null) {
          numWorkers = Math.min(numWorkers, TaskMaster.MAX_NUM_WORKERS);
        } else {
          numWorkers = TaskMaster.DEFAULT_NUM_WORKERS;
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
            _results.push(new TaskMaster(this, wrappedCb, this._range, workerFile));
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
    return HashCash;
  });

}).call(this);

/*
//@ sourceMappingURL=hashcash.js.map
*/