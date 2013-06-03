## we use our own sha1 instead of crypto for a more lean browser
## implementation with browserify
sha1 = require "./sha1"
childProcess = require "child_process"

## hashcash format:
## ver:bits:date:resource:rand:counter

numLeading0s = (hex_str) ->
  num = 0
  for pos in [ 0 .. hex_str.length - 1 ]
    curNum = parseInt hex_str[pos], 16
    break if isNaN curNum

    switch curNum
      when 0b0000                         then num += 4  ## continue
      when 0b0001                         then return num + 3
      when 0b0010, 0b0011                 then return num + 2
      when 0b0100, 0b0101, 0b0110, 0b0111 then return num + 1
      else return num

  num

buildDate = (date) ->
  if typeof(date) is "string"
    return null if date.length isnt 6
    return date

  return null if typeof(date) isnt "number"

  return buildDate "#{date}"

nodeGenerate = (data, callback) ->
  ## TODO(jrubin) use <NUM_CPUS> workers
  ## workers will get new counter value from main
  ## TODO(jrubin) make workers static variables
  ## and only create if non-existant
  worker = childProcess.fork __dirname + "/worker.js"

  worker.on "message", (test) ->
    worker.disconnect()
    callback test

  worker.send data

webWorkerGenerate = (data, callback) ->
  ## TODO(jrubin) use 4 workers
  ## workers will get new counter value from main
  ## TODO(jrubin) make workers static variables
  ## and only create if non-existant
  worker = new Worker data.file

  worker.onmessage = (event) ->
    worker.terminate()
    callback event.data

  worker.postMessage data

## TODO(jrubin) add a stop method

browserGenerate = (data, callback) ->
  RUNTIME_MAX = 99
  TIMEOUT = 1

  timeoutFn = ->
    start = new Date()

    until data.result? or (new Date() - start >= RUNTIME_MAX)
      HashCash.testSha(data)

    if data.result?
      callback data.result
    else
      setTimeout timeoutFn, TIMEOUT

  setTimeout timeoutFn, TIMEOUT

nextPos = (str, pos) ->
  pos.start = pos.end + 1
  return false if pos.start is str.length
  pos.end = str.indexOf ':', pos.start
  return false if pos.end is -1
  return false if pos.end is pos.start
  true

class HashCash
  ## STATIC

  @VERSION: 1
  @MIN_BITS: 16
  @hash: sha1.hash

  @genDate: ->
    now = new Date()
    yy = ("0" + (now.getYear() - 100))[-2..]
    mm = ('0' + (now.getMonth() + 1))[-2..]
    dd = ('0' + now.getDate())[-2..]

    "#{yy}#{mm}#{dd}"

  @buildString: (parts) ->
    ret = ""

    return ret if not parts.version?
    ret += "#{parts.version}:"

    return ret if not parts.bits?
    ret += "#{parts.bits}:"

    return ret if not parts.date?
    date = buildDate parts.date
    return ret if not date?
    ret += "#{date}:"

    return ret if not parts.resource?
    ret += "#{parts.resource}:"

    return ret if not parts.rand?
    ret += parts.rand

    return ret if not parts.counter?
    ret += ":#{parts.counter}"

  @testSha: (data) ->
    test = "#{data.challenge}:#{data.counter}"
    sha = sha1.hash test

    if numLeading0s(sha) >= data.bits
      data.result = test
    else
      data.counter += 1

    undefined

  @parse: (str) ->
    return null if not str?

    data = {}

    pos =
      start: 0
      end: -1
      length: ->
        @end - @start

    return null if not nextPos str, pos
    data.version = parseInt str.substr(pos.start, pos.length()), 10
    return null if isNaN data.version

    return null if not nextPos str, pos
    data.bits = parseInt str.substr(pos.start, pos.length()), 10
    return null if isNaN data.bits

    return null if not nextPos str, pos
    data.date = parseInt str.substr(pos.start, pos.length()), 10
    return null if isNaN data.date

    return null if not nextPos str, pos
    data.resource = str.substr pos.start, pos.length()
    return null if not data.resource.length

    return null if not nextPos str, pos
    data.rand = str.substr pos.start, pos.length()
    return null if not data.rand.length

    ## allow -1 for pos.end as it's the last field
    nextPos str, pos
    counterEnd = (if pos.end is -1 then str.length else pos.end) - pos.start
    data.counter = parseInt str.substr(pos.start, counterEnd), 10
    return null if isNaN data.counter

    data

  ## INSTANCE

  constructor: (@bits, @workerFile) ->
    @bits = HashCash.MIN_BITS if @bits < HashCash.MIN_BITS

  generate: (resource, callback) ->
    parts =
      version: HashCash.VERSION
      bits: @bits
      date: HashCash.genDate()
      resource: resource
      rand: Math.random().toString(36).substr 2

    data =
      file: @workerFile
      challenge: HashCash.buildString parts
      counter: 0
      bits: parts.bits

    ###
    Use different strategies to ensure the main javascript thread is not
    hung up while generating the HashCash

    1. Under Node, we use child_process
    2. In browsers that support it, use web workers
    3. In other browsers, use setTimeout
    ###

    if not window?
      ## running under node
      nodeGenerate data, callback
    else if Worker? and @workerFile?
      ## browser with web workers
      webWorkerGenerate data, callback
    else
      ## other browser
      browserGenerate data, callback

  validate: (str) ->
    return false if not str?
    return false if not @bits?

    data = HashCash.parse str

    return false if not data?
    return false if data.bits < @bits
    return false if data.bits < HashCash.MIN_BITS

    return false if data.version isnt HashCash.VERSION

    now = HashCash.genDate()
    return false if data.date < now - 1 or data.date > now + 1

    numLeading0s(sha1.hash(str)) >= data.bits

exports.HashCash = HashCash
