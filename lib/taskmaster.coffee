os           = require "os"
childProcess = require "child_process"
sha1         = require "./sha1"
properties   = require "./properties"

TIMEOUT_MAX_RUNTIME = 99
TIMEOUT_YIELD_TIME  =  1

_send = (data) ->
  @_spawn()
  return unless @sendFn?
  @sendFn data

_spawn = ->
  return if @worker?
  @connect()

_incRange = ->
  @_range.begin = @_range.end + 1
  @_range.end = @_range.begin + TaskMaster.RANGE_INCREMENT - 1

_sendRange = ->
  @_incRange()
  @_send m: "range", range: @_range

_gotResult = (result) ->
  return unless result?
  @_callback.call @_caller, result

_gotMessage = (msg) ->
  return unless msg?.m?

  switch msg.m
    when "request_range" then @_sendRange()
    when "result" then @_gotResult msg.result
    when "console_log" then console.log "worker", msg.data

_workerSendData = (data) -> @_send m: "data", data: data

_workerStop = ->
  return unless @worker?
  @disconnect()
  delete @worker
  delete @sendFn

_nodeConnect = ->
  @worker = childProcess.fork __dirname + "/worker.js"
  me = this
  @worker.on "message", (data) -> me._gotMessage.call me, data
  properties.makeReadOnly @worker
  @sendFn = (data) -> @worker.send data

_nodeDisconnect = -> @worker.disconnect()

_webConnect = ->
  @worker = new Worker @file
  me = this
  @worker.onmessage = (event) -> me._gotMessage.call me, event.data
  properties.makeReadOnly @worker
  @sendFn = (data) -> @worker.postMessage data

_webDisconnect = -> @worker.terminate()

_timeoutSendData = (@_data) ->
  delete @_stopFlag
  _timeoutStart.apply this

_timeoutStart = ->
  startTime = new Date()

  until @_stopFlag? or @_data.result? or
        (new Date() - startTime >= TIMEOUT_MAX_RUNTIME)
    sha1.tryChallenge @_data

  if @_stopFlag?
    ## do nothing
  else if @_data.result?
    @_callback.call @_caller, @_data.result
  else
    me = this
    setTimeout (-> _timeoutStart.apply me), TIMEOUT_YIELD_TIME

_timeoutStop = -> @_stopFlag = true

class TaskMaster
  @RANGE_INCREMENT: Math.pow 2, 15

  constructor: (@_caller, @_callback, @_range) ->
    properties.makeReadOnly this

  _send:       -> _send.apply       this, arguments
  _spawn:      -> _spawn.apply      this, arguments
  _incRange:   -> _incRange.apply   this, arguments
  _sendRange:  -> _sendRange.apply  this, arguments
  _gotResult:  -> _gotResult.apply  this, arguments
  _gotMessage: -> _gotMessage.apply this, arguments

  sendData:  -> _workerSendData.apply this, arguments
  stop:      -> _workerStop.apply     this, arguments

properties.makeReadOnly type for type in [ TaskMaster, TaskMaster:: ]

class NodeTaskMaster extends (TaskMaster)
  @MAX_NUM_WORKERS     = if os.cpus? then os.cpus().length else 4
  @DEFAULT_NUM_WORKERS = @MAX_NUM_WORKERS

  constructor: (caller, callback, range) ->
    super caller, callback, range
    properties.makeReadOnly this

  connect:    -> _nodeConnect.apply    this, arguments
  disconnect: -> _nodeDisconnect.apply this, arguments

properties.makeReadOnly type for type in [ NodeTaskMaster, NodeTaskMaster:: ]

class WebTaskMaster extends (TaskMaster)
  @MAX_NUM_WORKERS     = 8
  @DEFAULT_NUM_WORKERS = 4

  constructor: (caller, callback, range, @file) ->
    super caller, callback, range
    properties.makeReadOnly this

  connect:    -> _webConnect.apply    this, arguments
  disconnect: -> _webDisconnect.apply this, arguments

properties.makeReadOnly type for type in [ WebTaskMaster, WebTaskMaster:: ]

class TimeoutTaskMaster
  @MAX_NUM_WORKERS     =  1
  @DEFAULT_NUM_WORKERS =  1

  constructor: (@_caller, @_callback) ->
    properties.makeReadOnly this

  sendData: -> _timeoutSendData.apply this, arguments
  stop:     -> _timeoutStop.apply     this, arguments

for type in [ TimeoutTaskMaster, TimeoutTaskMaster:: ]
  properties.makeReadOnly type

exports.NodeTaskMaster    = NodeTaskMaster
exports.WebTaskMaster     = WebTaskMaster
exports.TimeoutTaskMaster = TimeoutTaskMaster
