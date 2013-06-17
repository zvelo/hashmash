"use strict"

define [ "./sha1" ], (sha1) ->
  TIMEOUT_MAX_RUNTIME = 99
  TIMEOUT_YIELD_TIME  =  1

  exports = {}

  class TaskMaster
    @RANGE_INCREMENT: Math.pow 2, 15

    constructor: (@_range) ->
      @_sendQueue = []
      @_ready = false

    _send: (data) ->
      @_spawn()
      return unless @sendFn?
      return @sendFn data if @_ready
      @_sendQueue.push(data)

    _setGo: ->
      @_ready = true
      @_send @_sendQueue.shift() while @_sendQueue.length

    _spawn: ->
      return if @worker?
      @connect()

    _incRange: ->
      @_range.begin = @_range.end + 1
      @_range.end = @_range.begin + TaskMaster.RANGE_INCREMENT - 1

    _sendRange: ->
      @_incRange()
      @_send m: "range", range: @_range

    _gotResult: (result) ->
      throw new Error "TaskMaster expected a result" unless result?
      throw new Error "TaskMaster requires a resolver" unless @_resolver?
      @_resolver.resolve result

    _gotMessage: (msg) ->
      return unless msg?.m?

      switch msg.m
        when "ready" then @_setGo()
        when "request_range" then @_sendRange()
        when "result" then @_gotResult msg.result

    sendData: (@_resolver, data) ->
      throw new Error "TaskMaster requires a resolver" unless @_resolver?
      @_send m: "data", data: data

    stop: ->
      @_ready = false
      @_sendQueue.length = 0
      return unless @worker?
      @disconnect()
      delete @worker
      delete @sendFn

  exports.TaskMaster = TaskMaster

  class WebTaskMaster extends (TaskMaster)
    @MAX_NUM_WORKERS     = 8
    @DEFAULT_NUM_WORKERS = 4

    constructor: (range, @file) -> super range

    connect: ->
      @worker = new Worker @file
      me = this
      @worker.onmessage = (event) -> me._gotMessage event.data
      @worker.onerror = (event) -> throw event.data
      @sendFn = (data) -> @worker.postMessage data

    disconnect: -> @worker.terminate()

  exports.WebTaskMaster = WebTaskMaster

  class TimeoutTaskMaster
    @MAX_NUM_WORKERS     =  1
    @DEFAULT_NUM_WORKERS =  1

    sendData: (@_resolver, @_data) ->
      throw new Error "TaskMaster requires a resolver" unless @_resolver?
      delete @_stopFlag
      @start()

    start: ->
      startTime = new Date()

      until @_stopFlag? or @_data.result? or
            (new Date() - startTime >= TIMEOUT_MAX_RUNTIME)
        sha1.tryChallenge @_data

      if @_stopFlag?
        ## do nothing
      else if @_data.result?
        throw new Error "TaskMaster requires a resolver" unless @_resolver?
        @_resolver.resolve @_data.result
      else
        me = this
        setTimeout ( -> me.start()), TIMEOUT_YIELD_TIME

    stop: -> @_stopFlag = true

  exports.TimeoutTaskMaster = TimeoutTaskMaster

  return exports
