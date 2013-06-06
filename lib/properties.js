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
