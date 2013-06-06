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

  sha1 = require("./sha1.coffee");

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
},{"./sha1.coffee":3,"__browserify_process":1}],3:[function(require,module,exports){
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


},{}]},{},[2])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9qcnViaW4vd29ya2luZy9ub2RlLWhhc2hjYXNoL25vZGVfbW9kdWxlcy9ncnVudC1jb2ZmZWVpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiL2hvbWUvanJ1YmluL3dvcmtpbmcvbm9kZS1oYXNoY2FzaC9saWIvd29ya2VyLmNvZmZlZSIsIi9ob21lL2pydWJpbi93b3JraW5nL25vZGUtaGFzaGNhc2gvbGliL3NoYTEuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtDQUFBLENBQUEsVUFBQTtDQUFBLEtBQUEsWUFBQTs7Q0FBQSxDQUVBLENBQU8sQ0FBUCxHQUFPLFFBQUE7O0NBRVAsQ0FBQSxFQUFHLHdDQUFIO0NBQ0UsRUFDRSxDQURGLEdBQUE7Q0FDRSxDQUFLLENBQUwsR0FBQSxHQUFLO0NBQ0gsR0FBQSxRQUFBO0NBQUEsR0FBYyxJQUFkLHNDQUFBO0NBQUEsZUFBQTtVQUFBO0NBQUEsRUFDTyxDQUFQLENBQVksR0FBWixDQUFjO0NBQ1IsSUFBRCxDQUFMLFNBQUE7Q0FDRSxDQUFHLFFBQUgsR0FBQTtDQUFBLENBQ00sRUFBTixNQUFBO0NBTEMsU0FHSDtDQUhGLE1BQUs7Q0FG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OztDQWxJaEIsQ0E2SUEsQ0FBb0IsQ0FBcEIsS0FBcUI7Q0FBcUIsRUFBVixNQUFBLEVBQUE7Q0E3SWhDLEVBNklvQjs7Q0E3SXBCLENBOElBLENBQW9CLENBQWhCLEVBQWdCLEdBQXBCO0NBQTJDLEtBQVgsSUFBQSxDQUFBO0NBOUloQyxFQThJb0I7O0NBOUlwQixDQStJQSxDQUFvQixDQUFoQixLQUFpQixHQUFyQjtDQUE4QyxHQUFkLE9BQUEsRUFBQTtDQS9JaEMsRUErSW9COztDQS9JcEIsQ0FpSkEsQ0FDRSxHQURGO0NBQ0UsQ0FBYyxFQUFkLENBQUEsR0FBQTtDQUFBLENBQ2MsRUFBZCxDQURBLEtBQ0E7Q0FEQSxDQUVjLEVBQWQsQ0FGQSxPQUVBO0NBcEpGLEdBQUE7O0FBc0pBLENBQUEsTUFBQSxJQUFBOzhDQUFBO0NBQUEsQ0FBNEIsQ0FBNUIsQ0FBQSxFQUFNLFFBQU47Q0FBQSxFQXRKQTs7Q0FBQSxDQXdKQSxDQUFpQixDQXhKakIsRUF3Sk0sQ0FBTjtDQXhKQSIsInNvdXJjZXNDb250ZW50IjpbIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICBpZiAoZXYuc291cmNlID09PSB3aW5kb3cgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCJcblxuc2hhMSA9IHJlcXVpcmUgXCIuL3NoYTEuY29mZmVlXCJcblxuaWYgc2VsZj9cbiAgc2VsZi5jb25zb2xlID1cbiAgICBsb2c6IC0+XG4gICAgICByZXR1cm4gdW5sZXNzIGRyb25lP1xuICAgICAgYXJncyA9IEFycmF5OjpzbGljZS5jYWxsIGFyZ3VtZW50c1xuICAgICAgZHJvbmUuc2VuZEZuXG4gICAgICAgIG06IFwiY29uc29sZV9sb2dcIixcbiAgICAgICAgZGF0YTogYXJnc1xuXG5jbGFzcyBEcm9uZVxuICBATUFYX1JVTlRJTUUgPSA5OVxuICBAWUlFTERfVElNRSA9IDFcblxuICBjb25zdHJ1Y3RvcjogKEBzZW5kRm4pIC0+XG5cbiAgZ290TWVzc2FnZTogKG1zZykgLT5cbiAgICByZXR1cm4gdW5sZXNzIG1zZy5tP1xuXG4gICAgc3dpdGNoIG1zZy5tXG4gICAgICB3aGVuIFwiZGF0YVwiICB0aGVuIEBfZ290RGF0YSAgbXNnLmRhdGFcbiAgICAgIHdoZW4gXCJyYW5nZVwiIHRoZW4gQF9nb3RSYW5nZSBtc2cucmFuZ2VcblxuICBfZ290RGF0YTogKHZhbHVlKSAtPlxuICAgIHJldHVybiB1bmxlc3MgdmFsdWU/XG5cbiAgICBAX2RhdGEgPSB2YWx1ZVxuICAgIEBfcmVxdWVzdFJhbmdlKClcblxuICBfZ290UmFuZ2U6ICh2YWx1ZSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIHZhbHVlP1xuXG4gICAgQF9yYW5nZSA9IHZhbHVlXG4gICAgQF9kYXRhLmNvdW50ZXIgPSBAX3JhbmdlLmJlZ2luXG4gICAgQHN0YXJ0KClcblxuICBfcmVxdWVzdFJhbmdlOiAtPiBAc2VuZEZuIG06IFwicmVxdWVzdF9yYW5nZVwiXG5cbiAgX3NlbmRSZXN1bHQ6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAX2RhdGEucmVzdWx0P1xuICAgIEBzZW5kRm4gbTogXCJyZXN1bHRcIiwgcmVzdWx0OiBAX2RhdGEucmVzdWx0XG5cbiAgc3RhcnQ6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAX2RhdGE/IGFuZCBAX3JhbmdlP1xuXG4gICAgdW50aWwgQF9kYXRhLnJlc3VsdD8gb3IgQF9kYXRhLmNvdW50ZXIgaXMgQF9yYW5nZS5lbmRcbiAgICAgIHNoYTEudHJ5Q2hhbGxlbmdlIEBfZGF0YVxuXG4gICAgaWYgQF9kYXRhLnJlc3VsdD9cbiAgICAgIEBfc2VuZFJlc3VsdCgpXG4gICAgZWxzZVxuICAgICAgQF9yZXF1ZXN0UmFuZ2UoKVxuXG5pZiBzZWxmP1xuICAjIyBydW5uaW5nIGluIGEgYnJvd3NlciB3aXRoIHdlYiB3b3JrZXJzXG4gIGRyb25lID0gbmV3IERyb25lIChkYXRhKSAtPiBzZWxmLnBvc3RNZXNzYWdlIGRhdGFcbiAgc2VsZi5vbm1lc3NhZ2UgPSAoZXZlbnQpIC0+IGRyb25lLmdvdE1lc3NhZ2UgZXZlbnQuZGF0YVxuZWxzZVxuICAjIyBydW5uaW5nIHVuZGVyIG5vZGVcbiAgZHJvbmUgPSBuZXcgRHJvbmUgKGRhdGEpIC0+IHByb2Nlc3Muc2VuZCBkYXRhXG4gIHByb2Nlc3Mub24gXCJtZXNzYWdlXCIsIChkYXRhKSAtPiBkcm9uZS5nb3RNZXNzYWdlIGRhdGFcbiIsIlwidXNlIHN0cmljdFwiXG5cblJPVEwgPSAoeCwgbikgLT5cbiAgcmV0dXJuICh4IDw8IG4pIHwgKHggPj4+ICgzMiAtIG4pKVxuXG50b0hleFN0ciA9IChuKSAtPlxuICBzID0gXCJcIlxuXG4gIGZvciBpIGluIFsgNyAuLiAwIF1cbiAgICB2ID0gKG4gPj4+IChpICogNCkpICYgMHhmXG4gICAgcyArPSB2LnRvU3RyaW5nIDE2XG5cbiAgc1xuXG5mID0gKHMsIHgsIHksIHopIC0+XG4gIHN3aXRjaCBzXG4gICAgd2hlbiAwIHRoZW4gKHggJiB5KSBeICh+eCAmIHopICAgICAgICAgICAjIyBDaCgpXG4gICAgd2hlbiAxIHRoZW4geCBeIHkgXiB6ICAgICAgICAgICAgICAgICAgICAjIyBQYXJpdHkoKVxuICAgIHdoZW4gMiB0aGVuICh4ICYgeSkgXiAoeCAmIHopIF4gKHkgJiB6KSAgIyMgTWFqKClcbiAgICB3aGVuIDMgdGhlbiB4IF4geSBeIHogICAgICAgICAgICAgICAgICAgICMjIFBhcml0eSgpXG5cbl9zaGExaGFzaCA9IChtc2cpIC0+XG4gICMjIGNvbnN0YW50cyBbNC4yLjFdXG4gIEsgPSBbXG4gICAgMHg1YTgyNzk5OVxuICAgIDB4NmVkOWViYTFcbiAgICAweDhmMWJiY2RjXG4gICAgMHhjYTYyYzFkNlxuICBdXG5cbiAgIyMgUFJFUFJPQ0VTU0lOR1xuXG4gICMjIGFkZCB0cmFpbGluZyAnMScgYml0ICgrIDAncyBwYWRkaW5nKSB0byBzdHJpbmcgWzUuMS4xXVxuICBtc2cgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSAweDgwXG5cbiAgIyMgY29udmVydCBzdHJpbmcgbXNnIGludG8gNTEyLWJpdCAvIDE2LWludGVnZXIgYmxvY2tzIGFycmF5cyBvZiBpbnRzIFs1LjIuMV1cblxuICAjIyBsZW5ndGggKGluIDMyLWJpdCBpbnRlZ2Vycykgb2YgbXNnICsgMSArIGFwcGVuZGVkIGxlbmd0aFxuICBsID0gbXNnLmxlbmd0aCAvIDQgKyAyXG5cbiAgIyMgbnVtYmVyIG9mIDE2LWludGVnZXItYmxvY2tzIHJlcXVpcmVkIHRvIGhvbGQgJ2wnIGludHNcbiAgTiA9IE1hdGguY2VpbCBsIC8gMTZcblxuICBNID0gW11cblxuICBmb3IgaSBpbiBbIDAgLi4gTiAtIDEgXVxuICAgIE1baV0gPSBbXVxuXG4gICAgZm9yIGogaW4gWyAwIC4uIDE1IF0gIyMgZW5jb2RlIDQgY2hhcnMgcGVyIGludGVnZXIsIGJpZy1lbmRpYW4gZW5jb2RpbmdcbiAgICAgICMjIG5vdGUgcnVubmluZyBvZmYgdGhlIGVuZCBvZiBtc2cgaXMgb2sgJ2NvcyBiaXR3aXNlIG9wcyBvbiBOYU4gcmV0dXJuIDBcbiAgICAgIE1baV1bal0gPSAobXNnLmNoYXJDb2RlQXQoaSAqIDY0ICsgaiAqIDQgKyAwKSA8PCAyNCkgfFxuICAgICAgICAgICAgICAgIChtc2cuY2hhckNvZGVBdChpICogNjQgKyBqICogNCArIDEpIDw8IDE2KSB8XG4gICAgICAgICAgICAgICAgKG1zZy5jaGFyQ29kZUF0KGkgKiA2NCArIGogKiA0ICsgMikgPDwgIDgpIHxcbiAgICAgICAgICAgICAgICAobXNnLmNoYXJDb2RlQXQoaSAqIDY0ICsgaiAqIDQgKyAzKSA8PCAgMClcblxuICAjIyBhZGQgbGVuZ3RoIChpbiBiaXRzKSBpbnRvIGZpbmFsIHBhaXIgb2YgMzItYml0IGludGVnZXJzIChiaWctZW5kaWFuKVxuICAjIyBbNS4xLjFdXG4gICMjIG5vdGU6IG1vc3Qgc2lnbmlmaWNhbnQgd29yZCB3b3VsZCBiZSAobGVuIC0gMSkgKiA4ID4+PiAzMixcbiAgIyMgYnV0IHNpbmNlIEpTIGNvbnZlcnRzIGJpdHdpc2Utb3AgYXJncyB0byAzMiBiaXRzLFxuICAjIyB3ZSBuZWVkIHRvIHNpbXVsYXRlIHRoaXMgYnkgYXJpdGhtZXRpYyBvcGVyYXRvcnNcblxuICBUV09fVE9fVEhJUlRZX1RXTyA9IDQyOTQ5NjcyOTYgICMjIE1hdGgucG93KDIsIDMyKVxuICBNW04gLSAxXVsxNF0gPSAoKG1zZy5sZW5ndGggLSAxKSAqIDgpIC8gVFdPX1RPX1RISVJUWV9UV09cbiAgTVtOIC0gMV1bMTRdID0gTWF0aC5mbG9vcihNW04gLSAxXVsxNF0pXG4gIE1bTiAtIDFdWzE1XSA9ICgobXNnLmxlbmd0aCAtIDEpICogOCkgJiAweGZmZmZmZmZmXG5cbiAgIyMgc2V0IGluaXRpYWwgaGFzaCB2YWx1ZSBbNS4zLjFdXG4gIEgwID0gMHg2NzQ1MjMwMVxuICBIMSA9IDB4ZWZjZGFiODlcbiAgSDIgPSAweDk4YmFkY2ZlXG4gIEgzID0gMHgxMDMyNTQ3NlxuICBINCA9IDB4YzNkMmUxZjBcblxuICAjIyBIQVNIIENPTVBVVEFUSU9OIFs2LjEuMl1cblxuICBXID0gW11cblxuICBmb3IgaSBpbiBbIDAgLi4gTiAtIDFdXG4gICAgIyMgMSAtIHByZXBhcmUgbWVzc2FnZSBzY2hlZHVsZSAnVydcbiAgICBXW3RdID0gTVtpXVt0XSBmb3IgdCBpbiBbIDAgLi4gMTUgXVxuXG4gICAgZm9yIHQgaW4gWyAxNiAuLiA3OSBdXG4gICAgICBXW3RdID0gUk9UTCBXW3QgLSAzXSBeIFdbdCAtIDhdIF4gV1t0IC0gMTRdIF4gV1t0IC0gMTZdLCAxXG5cbiAgICAjIyAyIC0gaW5pdGlhbGlzZSBmaXZlIHdvcmtpbmcgdmFyaWFibGVzIGEsIGIsIGMsIGQsIGVcbiAgICAjIyB3aXRoIHByZXZpb3VzIGhhc2ggdmFsdWVcbiAgICBhID0gSDBcbiAgICBiID0gSDFcbiAgICBjID0gSDJcbiAgICBkID0gSDNcbiAgICBlID0gSDRcblxuICAgICMjIDMgLSBtYWluIGxvb3BcbiAgICBmb3IgdCBpbiBbIDAgLi4gNzkgXVxuICAgICAgcyA9IE1hdGguZmxvb3IgdCAvIDIwICMjIHNlcSBmb3IgYmxvY2tzIG9mICdmJyBmdW5jdGlvbnMgYW5kICdLJyBjb25zdGFudHNcbiAgICAgIFQgPSAoUk9UTChhLCA1KSArIGYocywgYiwgYywgZCkgKyBlICsgS1tzXSArIFdbdF0pICYgMHhmZmZmZmZmZlxuICAgICAgZSA9IGRcbiAgICAgIGQgPSBjXG4gICAgICBjID0gUk9UTChiLCAzMClcbiAgICAgIGIgPSBhXG4gICAgICBhID0gVFxuXG4gICAgIyMgNCAtIGNvbXB1dGUgdGhlIG5ldyBpbnRlcm1lZGlhdGUgaGFzaCB2YWx1ZVxuICAgIEgwID0gKEgwICsgYSkgJiAweGZmZmZmZmZmICAjIyBub3RlICdhZGRpdGlvbiBtb2R1bG8gMl4zMidcbiAgICBIMSA9IChIMSArIGIpICYgMHhmZmZmZmZmZlxuICAgIEgyID0gKEgyICsgYykgJiAweGZmZmZmZmZmXG4gICAgSDMgPSAoSDMgKyBkKSAmIDB4ZmZmZmZmZmZcbiAgICBINCA9IChINCArIGUpICYgMHhmZmZmZmZmZlxuXG4gIHJldHVybiB0b0hleFN0cihIMCkgK1xuICAgICAgICAgdG9IZXhTdHIoSDEpICtcbiAgICAgICAgIHRvSGV4U3RyKEgyKSArXG4gICAgICAgICB0b0hleFN0cihIMykgK1xuICAgICAgICAgdG9IZXhTdHIoSDQpXG5cbl9sZWFkaW5nMHMgPSAoaGV4U3RyKSAtPlxuICBudW0gPSAwXG4gIGZvciBwb3MgaW4gWyAwIC4uIGhleFN0ci5sZW5ndGggLSAxIF1cbiAgICBjdXJOdW0gPSBwYXJzZUludCBoZXhTdHJbcG9zXSwgMTZcbiAgICBicmVhayBpZiBpc05hTiBjdXJOdW1cblxuICAgIHN3aXRjaCBjdXJOdW1cbiAgICAgIHdoZW4gMGIwMDAwICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gbnVtICs9IDQgICMjIGNvbnRpbnVlXG4gICAgICB3aGVuIDBiMDAwMSAgICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBudW0gKyAzXG4gICAgICB3aGVuIDBiMDAxMCwgMGIwMDExICAgICAgICAgICAgICAgICB0aGVuIHJldHVybiBudW0gKyAyXG4gICAgICB3aGVuIDBiMDEwMCwgMGIwMTAxLCAwYjAxMTAsIDBiMDExMSB0aGVuIHJldHVybiBudW0gKyAxXG4gICAgICBlbHNlIHJldHVybiBudW1cblxuICBudW1cblxuX3RyeUNoYWxsZW5nZSA9IChkYXRhKSAtPlxuICBjaGFsbGVuZ2UgPSBcIiN7ZGF0YS5jaGFsbGVuZ2V9OiN7ZGF0YS5jb3VudGVyfVwiXG4gIHNoYSA9IF9zaGExaGFzaCBjaGFsbGVuZ2VcblxuICBpZiBfbGVhZGluZzBzKHNoYSkgPj0gZGF0YS5iaXRzXG4gICAgZGF0YS5yZXN1bHQgPSBjaGFsbGVuZ2VcbiAgICByZXR1cm4gdHJ1ZVxuXG4gIGRhdGEuY291bnRlciArPSAxXG4gIHJldHVybiBmYWxzZVxuXG5zaGExICAgICAgICAgICAgICA9IChtc2cpICAgIC0+IF9zaGExaGFzaChtc2cpXG5zaGExLmxlYWRpbmcwcyAgICA9IChoZXhTdHIpIC0+IF9sZWFkaW5nMHMoaGV4U3RyKVxuc2hhMS50cnlDaGFsbGVuZ2UgPSAoZGF0YSkgICAtPiBfdHJ5Q2hhbGxlbmdlKGRhdGEpXG5cbmhpZGRlbiA9XG4gIHdyaXRhYmxlOiAgICAgZmFsc2VcbiAgZW51bWVyYWJsZTogICBmYWxzZVxuICBjb25maWd1cmFibGU6IGZhbHNlXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSBzaGExLCBrZXksIGhpZGRlbiBmb3Igb3duIGtleSBvZiBzaGExXG5cbm1vZHVsZS5leHBvcnRzID0gc2hhMVxuIl19
;