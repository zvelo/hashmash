(function() {
  "use strict";
  define(["./copyright", "../drone"], function(cc, drone) {
    drone = new Drone(function(data) {
      return self.postMessage(data);
    });
    return self.onmessage = function(event) {
      return drone.gotMessage(event.data);
    };
  });

}).call(this);

/*
//@ sourceMappingURL=worker.js.map
*/