"use strict"

define [ "./drone" ], (Drone) ->
  drone = new Drone (data) -> self.postMessage data
  self.onmessage = (event) -> drone.gotMessage event.data
