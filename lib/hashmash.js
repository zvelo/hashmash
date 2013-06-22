(function() {
  "use strict";
  define(["when", "./sha1"], function(whn, sha1) {
    var HashMash, _buildDate, _nextPos;
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
    HashMash = (function() {
      HashMash.VERSION = 1;

      HashMash.MIN_BITS = 16;

      HashMash.hash = sha1;

      HashMash.date = function() {
        var dd, mm, now, yy;
        now = new Date();
        yy = ("0" + (now.getYear() - 100)).slice(-2);
        mm = ('0' + (now.getMonth() + 1)).slice(-2);
        dd = ('0' + now.getDate()).slice(-2);
        return "" + yy + mm + dd;
      };

      HashMash.parse = function(str) {
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

      HashMash.unparse = function(parts) {
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

      function HashMash(_bits, workerFile, numWorkers) {
        var TaskMaster, num;
        this._bits = _bits;
        if (this._bits < HashMash.MIN_BITS) {
          this._bits = HashMash.MIN_BITS;
        }
        this._workers = [];
        this._range = {};
        this._resetRange();
        /*
        Use different strategies to ensure the main javascript thread is not
        hung up while generating the hashmash
        
        1. Under Node, we use child_process
        2. In browsers that support it, use web workers
        3. In other browsers, use setTimeout
        */

        TaskMaster = HashMash.TaskMaster;
        if ((workerFile == null) && (HashMash.BackupTaskMaster != null)) {
          TaskMaster = HashMash.BackupTaskMaster;
        }
        if (numWorkers != null) {
          numWorkers = Math.min(numWorkers, TaskMaster.MAX_NUM_WORKERS);
        } else {
          numWorkers = TaskMaster.DEFAULT_NUM_WORKERS;
        }
        if (!numWorkers) {
          return;
        }
        this._workers = (function() {
          var _i, _results;
          _results = [];
          for (num = _i = 1; 1 <= numWorkers ? _i <= numWorkers : _i >= numWorkers; num = 1 <= numWorkers ? ++_i : --_i) {
            _results.push(new TaskMaster(this._range, workerFile));
          }
          return _results;
        }).call(this);
      }

      HashMash.prototype._resetRange = function() {
        return this._range = {
          begin: 0,
          end: -1
        };
      };

      HashMash.prototype._sendData = function(resolver, data) {
        var worker, _i, _len, _ref, _results;
        _ref = this._workers;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          worker = _ref[_i];
          _results.push(worker.sendData(resolver, data));
        }
        return _results;
      };

      HashMash.prototype.stop = function() {
        var worker, _i, _len, _ref, _results;
        _ref = this._workers;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          worker = _ref[_i];
          _results.push(worker.stop());
        }
        return _results;
      };

      HashMash.prototype.generate = function(resource) {
        var data, err, parts, promise, resolver, _ref;
        this._resetRange();
        _ref = whn.defer(), resolver = _ref.resolver, promise = _ref.promise;
        parts = {
          version: HashMash.VERSION,
          bits: this._bits,
          date: HashMash.date(),
          resource: resource,
          rand: Math.random().toString(36).substr(2)
        };
        data = {
          challenge: HashMash.unparse(parts),
          counter: 0,
          bits: parts.bits
        };
        try {
          this._sendData(resolver, data);
        } catch (_error) {
          err = _error;
          resolver.reject(err);
        }
        promise.ensure(this.stop.bind(this));
        return promise;
      };

      HashMash.prototype.validate = function(str) {
        var data, now;
        if (!((str != null) && typeof str === "string")) {
          return;
        }
        if (this._bits == null) {
          return;
        }
        data = HashMash.parse(str);
        if (data == null) {
          return;
        }
        if (data.bits < this._bits) {
          return;
        }
        if (data.bits < HashMash.MIN_BITS) {
          return;
        }
        if (data.version !== HashMash.VERSION) {
          return;
        }
        now = HashMash.date();
        if (data.date < now - 1 || data.date > now + 1) {
          return;
        }
        if (!(sha1.leading0s(HashMash.hash(str)) >= data.bits)) {
          return;
        }
        return data;
      };

      return HashMash;

    })();
    return HashMash;
  });

}).call(this);

/*
//@ sourceMappingURL=hashmash.js.map
*/