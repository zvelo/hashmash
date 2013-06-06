(function() {
  "use strict";
  var HIDDEN_READ_ONLY, READ_ONLY,
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

  exports.makeReadOnly = function(type) {
    var key, _results;
    if (Object.defineProperty != null) {
      _results = [];
      for (key in type) {
        if (!__hasProp.call(type, key)) continue;
        if (typeof key === "string" && key[0] === '_') {
          _results.push(Object.defineProperty(type, key, {
            enumerable: false
          }));
        }
      }
      return _results;
    }
  };

}).call(this);

/*
//@ sourceMappingURL=properties.js.map
*/