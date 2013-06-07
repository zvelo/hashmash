"use strict"

path      = require "path"
requirejs = require "requirejs"

requirejs.config
  baseUrl: path.join __dirname, ".."
  nodeRequire: require

Drone = requirejs "./drone"

drone = new Drone (data) -> process.send data
process.on "message", (data) -> drone.gotMessage data
