/*global define, self */

(function () {
    "use strict";

    define(["./lib/drone"], function (Drone) {
        var drone = new Drone(function (data) {
            return self.postMessage(data);
        });

        self.onmessage = function (event) {
            return drone.gotMessage(event.data);
        };
    });
}());
