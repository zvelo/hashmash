(function() {
  "use strict";
  define(["./sha1"], function(sha1) {
    var Drone;
    Drone = (function() {
      Drone.MAX_RUNTIME = 99;

      Drone.YIELD_TIME = 1;

      function Drone(sendFn) {
        this.sendFn = sendFn;
        this.sendFn({
          m: "ready"
        });
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
    return Drone;
  });

}).call(this);

/*
//@ sourceMappingURL=drone.js.map
*/