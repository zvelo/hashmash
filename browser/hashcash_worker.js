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
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(require,module,exports){
(function(process){(function() {
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
})(require("__browserify_process"))
},{"./sha1":3,"__browserify_process":1}],3:[function(require,module,exports){
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
},{}]},{},[2])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvanJ1YmluL3dvcmtpbmcvcHJlY2lzZS9ub2RlLWhhc2hjYXNoL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbnNlcnQtbW9kdWxlLWdsb2JhbHMvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9Vc2Vycy9qcnViaW4vd29ya2luZy9wcmVjaXNlL25vZGUtaGFzaGNhc2gvbGliL3dvcmtlci5qcyIsIi9Vc2Vycy9qcnViaW4vd29ya2luZy9wcmVjaXNlL25vZGUtaGFzaGNhc2gvbGliL3NoYTEuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICBpZiAoZXYuc291cmNlID09PSB3aW5kb3cgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwiKGZ1bmN0aW9uKHByb2Nlc3MpeyhmdW5jdGlvbigpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHZhciBEcm9uZSwgZHJvbmUsIHNoYTE7XG5cbiAgc2hhMSA9IHJlcXVpcmUoXCIuL3NoYTFcIik7XG5cbiAgaWYgKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiICYmIHNlbGYgIT09IG51bGwpIHtcbiAgICBzZWxmLmNvbnNvbGUgPSB7XG4gICAgICBsb2c6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgaWYgKHR5cGVvZiBkcm9uZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCBkcm9uZSA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIGRyb25lLnNlbmRGbih7XG4gICAgICAgICAgbTogXCJjb25zb2xlX2xvZ1wiLFxuICAgICAgICAgIGRhdGE6IGFyZ3NcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIERyb25lID0gKGZ1bmN0aW9uKCkge1xuICAgIERyb25lLk1BWF9SVU5USU1FID0gOTk7XG5cbiAgICBEcm9uZS5ZSUVMRF9USU1FID0gMTtcblxuICAgIGZ1bmN0aW9uIERyb25lKHNlbmRGbikge1xuICAgICAgdGhpcy5zZW5kRm4gPSBzZW5kRm47XG4gICAgfVxuXG4gICAgRHJvbmUucHJvdG90eXBlLmdvdE1lc3NhZ2UgPSBmdW5jdGlvbihtc2cpIHtcbiAgICAgIGlmIChtc2cubSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHN3aXRjaCAobXNnLm0pIHtcbiAgICAgICAgY2FzZSBcImRhdGFcIjpcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZ290RGF0YShtc2cuZGF0YSk7XG4gICAgICAgIGNhc2UgXCJyYW5nZVwiOlxuICAgICAgICAgIHJldHVybiB0aGlzLl9nb3RSYW5nZShtc2cucmFuZ2UpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBEcm9uZS5wcm90b3R5cGUuX2dvdERhdGEgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5fZGF0YSA9IHZhbHVlO1xuICAgICAgcmV0dXJuIHRoaXMuX3JlcXVlc3RSYW5nZSgpO1xuICAgIH07XG5cbiAgICBEcm9uZS5wcm90b3R5cGUuX2dvdFJhbmdlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3JhbmdlID0gdmFsdWU7XG4gICAgICB0aGlzLl9kYXRhLmNvdW50ZXIgPSB0aGlzLl9yYW5nZS5iZWdpbjtcbiAgICAgIHJldHVybiB0aGlzLnN0YXJ0KCk7XG4gICAgfTtcblxuICAgIERyb25lLnByb3RvdHlwZS5fcmVxdWVzdFJhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZW5kRm4oe1xuICAgICAgICBtOiBcInJlcXVlc3RfcmFuZ2VcIlxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIERyb25lLnByb3RvdHlwZS5fc2VuZFJlc3VsdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuX2RhdGEucmVzdWx0ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuc2VuZEZuKHtcbiAgICAgICAgbTogXCJyZXN1bHRcIixcbiAgICAgICAgcmVzdWx0OiB0aGlzLl9kYXRhLnJlc3VsdFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIERyb25lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEoKHRoaXMuX2RhdGEgIT0gbnVsbCkgJiYgKHRoaXMuX3JhbmdlICE9IG51bGwpKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB3aGlsZSAoISgodGhpcy5fZGF0YS5yZXN1bHQgIT0gbnVsbCkgfHwgdGhpcy5fZGF0YS5jb3VudGVyID09PSB0aGlzLl9yYW5nZS5lbmQpKSB7XG4gICAgICAgIHNoYTEudHJ5Q2hhbGxlbmdlKHRoaXMuX2RhdGEpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2RhdGEucmVzdWx0ICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbmRSZXN1bHQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZXF1ZXN0UmFuZ2UoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIERyb25lO1xuXG4gIH0pKCk7XG5cbiAgaWYgKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiICYmIHNlbGYgIT09IG51bGwpIHtcbiAgICBkcm9uZSA9IG5ldyBEcm9uZShmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gc2VsZi5wb3N0TWVzc2FnZShkYXRhKTtcbiAgICB9KTtcbiAgICBzZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICByZXR1cm4gZHJvbmUuZ290TWVzc2FnZShldmVudC5kYXRhKTtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGRyb25lID0gbmV3IERyb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiBwcm9jZXNzLnNlbmQoZGF0YSk7XG4gICAgfSk7XG4gICAgcHJvY2Vzcy5vbihcIm1lc3NhZ2VcIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIGRyb25lLmdvdE1lc3NhZ2UoZGF0YSk7XG4gICAgfSk7XG4gIH1cblxufSkuY2FsbCh0aGlzKTtcblxuLypcbi8vQCBzb3VyY2VNYXBwaW5nVVJMPXdvcmtlci5qcy5tYXBcbiovXG59KShyZXF1aXJlKFwiX19icm93c2VyaWZ5X3Byb2Nlc3NcIikpIiwiKGZ1bmN0aW9uKCkge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgdmFyIFJPVEwsIGYsIGhpZGRlbiwga2V5LCBzaGExLCB0b0hleFN0ciwgX2xlYWRpbmcwcywgX3NoYTFoYXNoLCBfdHJ5Q2hhbGxlbmdlLFxuICAgIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIFJPVEwgPSBmdW5jdGlvbih4LCBuKSB7XG4gICAgcmV0dXJuICh4IDw8IG4pIHwgKHggPj4+ICgzMiAtIG4pKTtcbiAgfTtcblxuICB0b0hleFN0ciA9IGZ1bmN0aW9uKG4pIHtcbiAgICB2YXIgaSwgcywgdiwgX2k7XG4gICAgcyA9IFwiXCI7XG4gICAgZm9yIChpID0gX2kgPSA3OyBfaSA+PSAwOyBpID0gLS1faSkge1xuICAgICAgdiA9IChuID4+PiAoaSAqIDQpKSAmIDB4ZjtcbiAgICAgIHMgKz0gdi50b1N0cmluZygxNik7XG4gICAgfVxuICAgIHJldHVybiBzO1xuICB9O1xuXG4gIGYgPSBmdW5jdGlvbihzLCB4LCB5LCB6KSB7XG4gICAgc3dpdGNoIChzKSB7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIHJldHVybiAoeCAmIHkpIF4gKH54ICYgeik7XG4gICAgICBjYXNlIDE6XG4gICAgICAgIHJldHVybiB4IF4geSBeIHo7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIHJldHVybiAoeCAmIHkpIF4gKHggJiB6KSBeICh5ICYgeik7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIHJldHVybiB4IF4geSBeIHo7XG4gICAgfVxuICB9O1xuXG4gIF9zaGExaGFzaCA9IGZ1bmN0aW9uKG1zZykge1xuICAgIHZhciBIMCwgSDEsIEgyLCBIMywgSDQsIEssIE0sIE4sIFQsIFRXT19UT19USElSVFlfVFdPLCBXLCBhLCBiLCBjLCBkLCBlLCBpLCBqLCBsLCBzLCB0LCBfaSwgX2osIF9rLCBfbCwgX20sIF9uLCBfcmVmLCBfcmVmMTtcbiAgICBLID0gWzB4NWE4Mjc5OTksIDB4NmVkOWViYTEsIDB4OGYxYmJjZGMsIDB4Y2E2MmMxZDZdO1xuICAgIG1zZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4ODApO1xuICAgIGwgPSBtc2cubGVuZ3RoIC8gNCArIDI7XG4gICAgTiA9IE1hdGguY2VpbChsIC8gMTYpO1xuICAgIE0gPSBbXTtcbiAgICBmb3IgKGkgPSBfaSA9IDAsIF9yZWYgPSBOIC0gMTsgMCA8PSBfcmVmID8gX2kgPD0gX3JlZiA6IF9pID49IF9yZWY7IGkgPSAwIDw9IF9yZWYgPyArK19pIDogLS1faSkge1xuICAgICAgTVtpXSA9IFtdO1xuICAgICAgZm9yIChqID0gX2ogPSAwOyBfaiA8PSAxNTsgaiA9ICsrX2opIHtcbiAgICAgICAgTVtpXVtqXSA9IChtc2cuY2hhckNvZGVBdChpICogNjQgKyBqICogNCArIDApIDw8IDI0KSB8IChtc2cuY2hhckNvZGVBdChpICogNjQgKyBqICogNCArIDEpIDw8IDE2KSB8IChtc2cuY2hhckNvZGVBdChpICogNjQgKyBqICogNCArIDIpIDw8IDgpIHwgKG1zZy5jaGFyQ29kZUF0KGkgKiA2NCArIGogKiA0ICsgMykgPDwgMCk7XG4gICAgICB9XG4gICAgfVxuICAgIFRXT19UT19USElSVFlfVFdPID0gNDI5NDk2NzI5NjtcbiAgICBNW04gLSAxXVsxNF0gPSAoKG1zZy5sZW5ndGggLSAxKSAqIDgpIC8gVFdPX1RPX1RISVJUWV9UV087XG4gICAgTVtOIC0gMV1bMTRdID0gTWF0aC5mbG9vcihNW04gLSAxXVsxNF0pO1xuICAgIE1bTiAtIDFdWzE1XSA9ICgobXNnLmxlbmd0aCAtIDEpICogOCkgJiAweGZmZmZmZmZmO1xuICAgIEgwID0gMHg2NzQ1MjMwMTtcbiAgICBIMSA9IDB4ZWZjZGFiODk7XG4gICAgSDIgPSAweDk4YmFkY2ZlO1xuICAgIEgzID0gMHgxMDMyNTQ3NjtcbiAgICBINCA9IDB4YzNkMmUxZjA7XG4gICAgVyA9IFtdO1xuICAgIGZvciAoaSA9IF9rID0gMCwgX3JlZjEgPSBOIC0gMTsgMCA8PSBfcmVmMSA/IF9rIDw9IF9yZWYxIDogX2sgPj0gX3JlZjE7IGkgPSAwIDw9IF9yZWYxID8gKytfayA6IC0tX2spIHtcbiAgICAgIGZvciAodCA9IF9sID0gMDsgX2wgPD0gMTU7IHQgPSArK19sKSB7XG4gICAgICAgIFdbdF0gPSBNW2ldW3RdO1xuICAgICAgfVxuICAgICAgZm9yICh0ID0gX20gPSAxNjsgX20gPD0gNzk7IHQgPSArK19tKSB7XG4gICAgICAgIFdbdF0gPSBST1RMKFdbdCAtIDNdIF4gV1t0IC0gOF0gXiBXW3QgLSAxNF0gXiBXW3QgLSAxNl0sIDEpO1xuICAgICAgfVxuICAgICAgYSA9IEgwO1xuICAgICAgYiA9IEgxO1xuICAgICAgYyA9IEgyO1xuICAgICAgZCA9IEgzO1xuICAgICAgZSA9IEg0O1xuICAgICAgZm9yICh0ID0gX24gPSAwOyBfbiA8PSA3OTsgdCA9ICsrX24pIHtcbiAgICAgICAgcyA9IE1hdGguZmxvb3IodCAvIDIwKTtcbiAgICAgICAgVCA9IChST1RMKGEsIDUpICsgZihzLCBiLCBjLCBkKSArIGUgKyBLW3NdICsgV1t0XSkgJiAweGZmZmZmZmZmO1xuICAgICAgICBlID0gZDtcbiAgICAgICAgZCA9IGM7XG4gICAgICAgIGMgPSBST1RMKGIsIDMwKTtcbiAgICAgICAgYiA9IGE7XG4gICAgICAgIGEgPSBUO1xuICAgICAgfVxuICAgICAgSDAgPSAoSDAgKyBhKSAmIDB4ZmZmZmZmZmY7XG4gICAgICBIMSA9IChIMSArIGIpICYgMHhmZmZmZmZmZjtcbiAgICAgIEgyID0gKEgyICsgYykgJiAweGZmZmZmZmZmO1xuICAgICAgSDMgPSAoSDMgKyBkKSAmIDB4ZmZmZmZmZmY7XG4gICAgICBINCA9IChINCArIGUpICYgMHhmZmZmZmZmZjtcbiAgICB9XG4gICAgcmV0dXJuIHRvSGV4U3RyKEgwKSArIHRvSGV4U3RyKEgxKSArIHRvSGV4U3RyKEgyKSArIHRvSGV4U3RyKEgzKSArIHRvSGV4U3RyKEg0KTtcbiAgfTtcblxuICBfbGVhZGluZzBzID0gZnVuY3Rpb24oaGV4U3RyKSB7XG4gICAgdmFyIGN1ck51bSwgbnVtLCBwb3MsIF9pLCBfcmVmO1xuICAgIG51bSA9IDA7XG4gICAgZm9yIChwb3MgPSBfaSA9IDAsIF9yZWYgPSBoZXhTdHIubGVuZ3RoIC0gMTsgMCA8PSBfcmVmID8gX2kgPD0gX3JlZiA6IF9pID49IF9yZWY7IHBvcyA9IDAgPD0gX3JlZiA/ICsrX2kgOiAtLV9pKSB7XG4gICAgICBjdXJOdW0gPSBwYXJzZUludChoZXhTdHJbcG9zXSwgMTYpO1xuICAgICAgaWYgKGlzTmFOKGN1ck51bSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKGN1ck51bSkge1xuICAgICAgICBjYXNlIDB4MDpcbiAgICAgICAgICBudW0gKz0gNDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAweDE6XG4gICAgICAgICAgcmV0dXJuIG51bSArIDM7XG4gICAgICAgIGNhc2UgMHgyOlxuICAgICAgICBjYXNlIDB4MzpcbiAgICAgICAgICByZXR1cm4gbnVtICsgMjtcbiAgICAgICAgY2FzZSAweDQ6XG4gICAgICAgIGNhc2UgMHg1OlxuICAgICAgICBjYXNlIDB4NjpcbiAgICAgICAgY2FzZSAweDc6XG4gICAgICAgICAgcmV0dXJuIG51bSArIDE7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIG51bTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bTtcbiAgfTtcblxuICBfdHJ5Q2hhbGxlbmdlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBjaGFsbGVuZ2UsIHNoYTtcbiAgICBjaGFsbGVuZ2UgPSBcIlwiICsgZGF0YS5jaGFsbGVuZ2UgKyBcIjpcIiArIGRhdGEuY291bnRlcjtcbiAgICBzaGEgPSBfc2hhMWhhc2goY2hhbGxlbmdlKTtcbiAgICBpZiAoX2xlYWRpbmcwcyhzaGEpID49IGRhdGEuYml0cykge1xuICAgICAgZGF0YS5yZXN1bHQgPSBjaGFsbGVuZ2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZGF0YS5jb3VudGVyICs9IDE7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIHNoYTEgPSBmdW5jdGlvbihtc2cpIHtcbiAgICByZXR1cm4gX3NoYTFoYXNoKG1zZyk7XG4gIH07XG5cbiAgc2hhMS5sZWFkaW5nMHMgPSBmdW5jdGlvbihoZXhTdHIpIHtcbiAgICByZXR1cm4gX2xlYWRpbmcwcyhoZXhTdHIpO1xuICB9O1xuXG4gIHNoYTEudHJ5Q2hhbGxlbmdlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHJldHVybiBfdHJ5Q2hhbGxlbmdlKGRhdGEpO1xuICB9O1xuXG4gIGhpZGRlbiA9IHtcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZVxuICB9O1xuXG4gIGZvciAoa2V5IGluIHNoYTEpIHtcbiAgICBpZiAoIV9faGFzUHJvcC5jYWxsKHNoYTEsIGtleSkpIGNvbnRpbnVlO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzaGExLCBrZXksIGhpZGRlbik7XG4gIH1cblxuICBtb2R1bGUuZXhwb3J0cyA9IHNoYTE7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8qXG4vL0Agc291cmNlTWFwcGluZ1VSTD1zaGExLmpzLm1hcFxuKi8iXX0=
;