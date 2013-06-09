"use strict"

define [
  "os"
  "path"
  "module"
  "child_process"
  "../taskmaster"
], (os, path, module, childProcess, taskmaster) ->
  { TaskMaster } = taskmaster
  __dirname = path.dirname module.uri
  workerFile = path.join __dirname, "worker.js"

  class NodeTaskMaster extends (TaskMaster)
    @MAX_NUM_WORKERS     = if os.cpus? then os.cpus().length else 4
    @DEFAULT_NUM_WORKERS = @MAX_NUM_WORKERS

    constructor: (caller, cb, range) ->
      super caller, cb, range

    connect: ->
      @worker = childProcess.fork workerFile
      me = this
      @worker.on "message", (data) -> me._gotMessage data
      @sendFn = (data) -> @worker.send data

    disconnect: -> @worker.disconnect()

  return NodeTaskMaster
