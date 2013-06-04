os = require "os"
childProcess = require "child_process"
hashcash = require("./hashcash")

## TODO(jrubin) allow NUM_WORKERS to be configurable

class TaskMaster
  @RANGE_INCREMENT: Math.pow 2, 15

  constructor: (@_caller, @_id, @_range, @_callback, @worker, @_sendFn) ->
    @_sendFn m: "id", id: @_id

  sendData: (data) ->
    @_sendFn m: "data", data: data

  _nextRange: ->
    @_range.begin = @_range.end + 1
    @_range.end = @_range.begin + TaskMaster.RANGE_INCREMENT - 1
    @_range

  _sendRange: ->
    range = @_nextRange()
    @_sendFn m: "range", range: range

  _gotResult: (id, result) ->
    return unless result?
    @_callback.call @_caller, result, id, @worker

  _gotMessage: (msg) ->
    return unless msg?.m?

    switch msg.m
      when "request_range" then @_sendRange()
      when "result" then @_gotResult msg.id, msg.result
      when "console_log" then console.log "worker #{msg.id}", msg.data

  stop: -> @_sendFn m: "stop"
  completed: (challenge) -> @_sendFn m: "completed", challenge: challenge

class NodeTaskMaster extends (TaskMaster)
  @NUM_WORKERS = if os.cpus? then os.cpus().length else 0

  constructor: (caller, id, callback, range) ->
    worker = childProcess.fork __dirname + "/worker.js"

    me = @
    worker.on "message", (data) -> me._gotMessage data

    sendFn = (data) -> worker.send data

    super caller, id, range, callback, worker, sendFn

  disconnect: -> @worker.disconnect()

class WebTaskMaster extends (TaskMaster)
  @NUM_WORKERS = 4

  constructor: (caller, id, callback, range, file) ->
    worker = new Worker file

    me = @
    worker.onmessage = (event) -> me._gotMessage event.data
    sendFn = (data) -> worker.postMessage data

    super caller, id, range, callback, worker, sendFn

  disconnect: -> @worker.terminate()

class TimeoutTaskMaster
  @MAX_RUNTIME = 99
  @YIELD_TIME = 1
  @NUM_WORKERS = 1

  constructor: (@_caller, @_id, @_callback) ->

  sendData: (@_data) ->
    delete @_stopFlag
    @start()

  start: ->
    startTime = new Date()

    until @_stopFlag? or @_data.result? or
          (new Date() - startTime >= TimeoutTaskMaster.MAX_RUNTIME)
      hashcash.HashCash.testSha(@_data)

    if @_stopFlag?
      ## do nothing
    else if @_data.result?
      @_callback.call @_caller, @_data.result
    else
      me = @
      setTimeout (-> me.start.call me), TimeoutTaskMaster.YIELD_TIME

  stop: -> @_stopFlag = true
  completed: -> @stop()

exports.TaskMaster        = TaskMaster
exports.NodeTaskMaster    = NodeTaskMaster
exports.WebTaskMaster     = WebTaskMaster
exports.TimeoutTaskMaster = TimeoutTaskMaster
