"use strict"

define [ "./copyright", "../drone" ], (cc, drone) ->
  drone = new Drone (data) -> self.postMessage data
  self.onmessage = (event) -> drone.gotMessage event.data
