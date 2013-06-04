HashCash = require("./hashcash").HashCash

if self?
  self.console =
    log: ->
      return unless drone?
      args = Array::slice.call arguments
      drone.sendFn
        m: "console_log",
        id: if drone.id? then drone.id else -1
        data: args

class Drone
  @MAX_RUNTIME = 99
  @YIELD_TIME = 1

  constructor: (@sendFn) ->
    @_complete = {}

  gotMessage: (msg) ->
    return unless msg.m?

    switch msg.m
      when "id"        then @_gotId       msg.id
      when "data"      then @_gotData     msg.data
      when "range"     then @_gotRange    msg.range
      when "stop"      then @stop
      when "completed" then @_setComplete msg.challenge

  _setComplete: (challenge) ->
    @_complete[challenge] = true

  _isComplete: ->
    return @_complete.hasOwnProperty @_data.challenge

  _gotId: (value) ->
    return unless value?
    @id = value

  _gotData: (value) ->
    return unless value? and @id?

    @_data = value
    @_requestRange()

  _gotRange: (value) ->
    return unless value? and @id? and not @_isComplete()

    @_range = value
    @_data.counter = @_range.begin
    @start()

  _requestRange: ->
    return unless @id? and not @_isComplete()

    @sendFn
      m: "request_range"
      id: @id

  _sendResult: ->
    return unless @_data.result? and @id? and not @_isComplete()

    @stop()

    @sendFn
      m: "result"
      id: @id
      result: @_data.result

  stop: -> @_setComplete @_data.challenge

  start: ->
    return unless @_data? and @_range? and not @_isComplete()

    until @_data.result? or
          @_data.counter is @_range.end
      HashCash.testSha @_data

    if @_data.result?
      ## allow time for any incoming completed messages to be processed
      me = @
      process.nextTick -> me._sendResult.call me
    else
      @_requestRange()

if self?
  ## running in a browser with web workers
  drone = new Drone (data) -> self.postMessage data
  self.onmessage = (event) ->
    drone.gotMessage event.data
else
  ## running under node
  drone = new Drone (data) -> process.send data
  process.on "message", (data) ->
    drone.gotMessage data
