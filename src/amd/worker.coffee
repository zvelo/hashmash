"use strict"

define [ "./copyright", "../drone" ], (cc, Drone) ->
  drone = new Drone (data) -> self.postMessage data
  self.onmessage = (event) -> drone.gotMessage event.data
