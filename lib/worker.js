(function() {
  "use strict";
  var Drone, drone, sha1;

  sha1 = require("./sha1");

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
        sha1.tryChallenge(this._data);
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

/*
//@ sourceMappingURL=worker.js.map
*/