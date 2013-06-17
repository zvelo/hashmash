"use strict"

define [ "when", "./sha1" ], (whn, sha1) ->
  ## we use our own sha1 instead of crypto for a more lean browser
  ## implementation with requirejs

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

  class HashMash
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

    constructor: (@_bits, workerFile, numWorkers) ->
      @_bits = HashMash.MIN_BITS if @_bits < HashMash.MIN_BITS
      @_workers = []
      @_range = {}
      @_resetRange()

      ###
      Use different strategies to ensure the main javascript thread is not
      hung up while generating the hashmash

      1. Under Node, we use child_process
      2. In browsers that support it, use web workers
      3. In other browsers, use setTimeout
      ###

      TaskMaster = HashMash.TaskMaster

      if not workerFile? and HashMash.BackupTaskMaster?
        TaskMaster = HashMash.BackupTaskMaster

      if numWorkers?
        numWorkers = Math.min numWorkers, TaskMaster.MAX_NUM_WORKERS
      else
        numWorkers = TaskMaster.DEFAULT_NUM_WORKERS

      return unless numWorkers

      console.log "using #{numWorkers} workers"

      @_workers = (
        for num in [ 1 .. numWorkers ]
          new TaskMaster @_range, workerFile
      )

    ## PRIVATE

    _resetRange: -> @_range = begin: 0, end: -1
    _sendData: (resolver, data) ->
      for worker in @_workers
        worker.sendData resolver, data

    ## PUBLIC

    stop: -> worker.stop() for worker in @_workers

    generate: (resource) ->
      @_resetRange()

      { resolver, promise } = whn.defer()

      parts =
        version: HashMash.VERSION
        bits: @_bits
        date: HashMash.date()
        resource: resource
        rand: Math.random().toString(36).substr 2

      data =
        challenge: HashMash.unparse parts
        counter: 0
        bits: parts.bits

      try
        @_sendData resolver, data
      catch err
        resolver.reject err

      promise.ensure @stop.bind(this)

      return promise

    validate: (str) ->
      return false if not str?
      return false if not @_bits?

      data = HashMash.parse str

      return false if not data?
      return false if data.bits < @_bits
      return false if data.bits < HashMash.MIN_BITS

      return false if data.version isnt HashMash.VERSION

      now = HashMash.date()
      return false if data.date < now - 1 or data.date > now + 1

      sha1.leading0s(HashMash.hash(str)) >= data.bits

  return HashMash
