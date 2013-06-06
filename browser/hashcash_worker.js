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

})(require("__browserify_process"))
},{"./sha1":3,"__browserify_process":1}],3:[function(require,module,exports){
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

},{}]},{},[2])
;