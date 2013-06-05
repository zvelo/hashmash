os           = require "os"
childProcess = require "child_process"
hashcash     = require "./hashcash"

class TaskMaster
  @RANGE_INCREMENT: Math.pow 2, 15

  constructor: (@_caller, @_callback, @_range) ->

  _send: (data) ->
    @_spawn()
    return unless @sendFn?
    @sendFn data

  _spawn: ->
    return if @worker?
    @connect()

  sendData: (data) -> @_send m: "data", data: data

  _nextRange: ->
    @_range.begin = @_range.end + 1
    @_range.end = @_range.begin + TaskMaster.RANGE_INCREMENT - 1
    @_range

  _sendRange: ->
    range = @_nextRange()
    @_send m: "range", range: range

  _gotResult: (result) ->
    return unless result?
    @_callback.call @_caller, result

  _gotMessage: (msg) ->
    return unless msg?.m?

    switch msg.m
      when "request_range" then @_sendRange()
      when "result" then @_gotResult msg.result
      when "console_log" then console.log "worker", msg.data

  stop: ->
    return unless @worker?
    @disconnect()
    delete @worker
    delete @sendFn

class NodeTaskMaster extends (TaskMaster)
  @MAX_NUM_WORKERS = if os.cpus? then os.cpus().length else 4
  @DEFAULT_NUM_WORKERS = @MAX_NUM_WORKERS

  constructor: (caller, callback, range) ->
    super caller, callback, range

  connect: ->
    @worker = childProcess.fork __dirname + "/worker.js"
    me = this
    @worker.on "message", (data) -> me._gotMessage.call me, data
    @sendFn = (data) -> @worker.send data

  disconnect: -> @worker.disconnect()

class WebTaskMaster extends (TaskMaster)
  @MAX_NUM_WORKERS = 8
  @DEFAULT_NUM_WORKERS = 4

  constructor: (caller, callback, range, @file) ->
    super caller, callback, range

  connect: ->
    @worker = new Worker @file
    me = this
    @worker.onmessage = (event) -> me._gotMessage.call me, event.data
    @sendFn = (data) -> @worker.postMessage data

  disconnect: -> @worker.terminate()

class TimeoutTaskMaster
  @MAX_RUNTIME = 99
  @YIELD_TIME = 1
  @MAX_NUM_WORKERS = 1
  @DEFAULT_NUM_WORKERS = 1

  constructor: (@_caller, @_callback) ->

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
      me = this
      setTimeout (-> me.start.call me), TimeoutTaskMaster.YIELD_TIME

  stop: -> @_stopFlag = true

exports.TaskMaster        = TaskMaster
exports.NodeTaskMaster    = NodeTaskMaster
exports.WebTaskMaster     = WebTaskMaster
exports.TimeoutTaskMaster = TimeoutTaskMaster
