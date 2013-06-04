HashCash = require("./hashcash").HashCash

if self?
  self.console =
    log: ->
      return unless drone?
      args = Array::slice.call arguments
      drone.sendFn
        m: "console_log",
        data: args

class Drone
  @MAX_RUNTIME = 99
  @YIELD_TIME = 1

  constructor: (@sendFn) ->

  gotMessage: (msg) ->
    return unless msg.m?

    switch msg.m
      when "data"  then @_gotData  msg.data
      when "range" then @_gotRange msg.range

  _gotData: (value) ->
    return unless value?

    @_data = value
    @_requestRange()

  _gotRange: (value) ->
    return unless value?

    @_range = value
    @_data.counter = @_range.begin
    @start()

  _requestRange: -> @sendFn m: "request_range"

  _sendResult: ->
    return unless @_data.result?
    @sendFn m: "result", result: @_data.result

  start: ->
    return unless @_data? and @_range?

    until @_data.result? or @_data.counter is @_range.end
      HashCash.testSha @_data

    if @_data.result?
      @_sendResult()
    else
      @_requestRange()

if self?
  ## running in a browser with web workers
  drone = new Drone (data) -> self.postMessage data
  self.onmessage = (event) -> drone.gotMessage event.data
else
  ## running under node
  drone = new Drone (data) -> process.send data
  process.on "message", (data) -> drone.gotMessage data
