"use strict"

os           = require "os"
path         = require "path"
childProcess = require "child_process"
requirejs    = require "requirejs"

requirejs.config
  baseUrl: path.join __dirname, ".."
  nodeRequire: require

{ TaskMaster } = requirejs "./taskmaster"

class NodeTaskMaster extends (TaskMaster)
  @MAX_NUM_WORKERS     = if os.cpus? then os.cpus().length else 4
  @DEFAULT_NUM_WORKERS = @MAX_NUM_WORKERS

  constructor: (caller, cb, range) ->
    super caller, cb, range

  connect: ->
    @worker = childProcess.fork path.join __dirname, "worker.js"
    me = this
    @worker.on "message", (data) -> me._gotMessage data
    @sendFn = (data) -> @worker.send data

  disconnect: -> @worker.disconnect()

module.exports = NodeTaskMaster
