"use strict"

`if(typeof define !== 'function'){var define = (require('amdefine'))(module);}`
define [ "./sha1", "./taskmaster" ], (sha1, taskmaster) ->
  ## we use our own sha1 instead of crypto for a more lean browser
  ## implementation with requirejs

  { NodeTaskMaster, WebTaskMaster, TimeoutTaskMaster } = taskmaster

  _buildDate = (date) ->
    if typeof(date) is "string"
      return null if date.length isnt 6
      return date

    return null if typeof(date) isnt "number"

    return _buildDate "#{date}"

  _nextPos = (str, pos) ->
    pos.start = pos.end + 1
    return false if pos.start is str.length
    pos.end = str.indexOf ':', pos.start
    return false if pos.end is -1
    return false if pos.end is pos.start
    true

  ## hashcash format:
  ## ver:bits:date:resource:rand:counter

  class HashCash
    ## STATIC

    @VERSION:   1
    @MIN_BITS: 16
    @hash:   sha1

    @date: ->
      now = new Date()
      yy = ("0" + (now.getYear() - 100))[-2..]
      mm = ('0' + (now.getMonth() + 1))[-2..]
      dd = ('0' + now.getDate())[-2..]

      "#{yy}#{mm}#{dd}"

    @parse: (str) ->
      return null if not str?

      data = {}

      pos = start: 0, end: -1, length: -> @end - @start

      return null if not _nextPos str, pos
      data.version = parseInt str.substr(pos.start, pos.length()), 10
      return null if isNaN data.version

      return null if not _nextPos str, pos
      data.bits = parseInt str.substr(pos.start, pos.length()), 10
      return null if isNaN data.bits

      return null if not _nextPos str, pos
      data.date = parseInt str.substr(pos.start, pos.length()), 10
      return null if isNaN data.date

      return null if not _nextPos str, pos
      data.resource = str.substr pos.start, pos.length()
      return null if not data.resource.length

      return null if not _nextPos str, pos
      data.rand = str.substr pos.start, pos.length()
      return null if not data.rand.length

      ## allow -1 for pos.end as it's the last field
      _nextPos str, pos
      counterEnd = (if pos.end is -1 then str.length else pos.end) - pos.start
      data.counter = parseInt str.substr(pos.start, counterEnd), 10
      return null if isNaN data.counter

      data

    @unparse: (parts) ->
      ret = ""

      return ret if not parts.version?
      ret += "#{parts.version}:"

      return ret if not parts.bits?
      ret += "#{parts.bits}:"

      return ret if not parts.date?
      date = _buildDate parts.date
      return ret if not date?
      ret += "#{date}:"

      return ret if not parts.resource?
      ret += "#{parts.resource}:"

      return ret if not parts.rand?
      ret += parts.rand

      return ret if not parts.counter?
      ret += ":#{parts.counter}"

      ret

    ## INSTANCE

    constructor: (@_bits, cb, caller, workerFile, numWorkers) ->
      @_bits = HashCash.MIN_BITS if @_bits < HashCash.MIN_BITS
      @_workers = []
      @_range = {}
      @_resetRange()

      ###
      Use different strategies to ensure the main javascript thread is not
      hung up while generating the hashcash

      1. Under Node, we use child_process
      2. In browsers that support it, use web workers
      3. In other browsers, use setTimeout
      ###

      if not window?
        ## running under node
        type = NodeTaskMaster
      else if Worker? and workerFile?
        ## browser with web workers
        type = WebTaskMaster
      else
        ## other browser
        type = TimeoutTaskMaster

      if numWorkers?
        numWorkers = Math.min numWorkers, type.MAX_NUM_WORKERS
      else
        numWorkers = type.DEFAULT_NUM_WORKERS

      return unless numWorkers

      console.log "using #{numWorkers} workers"

      wrappedCb = (result) ->
        ## prevent races where multiple workers returned a result
        @stop()
        if caller?
          cb.call caller, result
        else
          cb result

      @_workers = (
        for num in [ 1 .. numWorkers ]
          new type this, wrappedCb, @_range, workerFile
      )

    ## PRIVATE

    _resetRange: -> @_range = begin: 0, end: -1
    _sendData: (data) -> worker.sendData data for worker in @_workers

    ## PUBLIC

    stop: -> worker.stop() for worker in @_workers

    generate: (resource) ->
      @_resetRange()

      parts =
        version: HashCash.VERSION
        bits: @_bits
        date: HashCash.date()
        resource: resource
        rand: Math.random().toString(36).substr 2

      data =
        challenge: HashCash.unparse parts
        counter: 0
        bits: parts.bits

      @_sendData data

    validate: (str) ->
      return false if not str?
      return false if not @_bits?

      data = HashCash.parse str

      return false if not data?
      return false if data.bits < @_bits
      return false if data.bits < HashCash.MIN_BITS

      return false if data.version isnt HashCash.VERSION

      now = HashCash.date()
      return false if data.date < now - 1 or data.date > now + 1

      sha1.leading0s(HashCash.hash(str)) >= data.bits

  return HashCash
