MAX_TESTS = 100

resource = "zvelo.com"
HashCash = hashcash.HashCash

hc = undefined
numBits = undefined
newNumBits = 19

STATUS_STOPPED = 0
STATUS_RUNNING = 1
STATUS_STOPPING = 2

status = STATUS_STOPPED

results = {}

window.toggle = ->
  switch status
    when STATUS_STOPPED
      setNumBits()
      setStatus STATUS_RUNNING
      test()
    when STATUS_RUNNING then setStatus STATUS_STOPPING
    else console.error "toggle from unknown state", status

window.changeNumBits = (elem) ->
  newNumBits = $(elem).val()

updateData = (start, hashcash) ->
  valid = hc.validate hashcash
  duration = (new Date() - start) / 1000
  results.min = duration if not results.min? or duration < results.min
  results.max = duration if not results.max? or duration > results.max
  results.duration += duration
  results.num += 1

  updateResults()

  console.log "test", results.num,
              hashcash, HashCash.hash(hashcash),
              "valid", valid,
              "duration", duration

  if status is STATUS_STOPPING
    setStatus STATUS_STOPPED
    return

  setNumBits()

  if results.num < MAX_TESTS
    test()
  else
    setStatus STATUS_STOPPED

setStatus = (value) ->
  status = value
  switch status
    when STATUS_STOPPED
      $("#toggle").removeAttr("disabled") .text "Start"
      $("#status").text "stopped"
    when STATUS_RUNNING
      $("#toggle").removeAttr("disabled") .text "Stop"
      $("#status").text "running"
    when STATUS_STOPPING
      $("#toggle").attr("disabled", "disabled") .text "Stopping"
      $("#status").text "stopping"

test = ->
  return if not resource.length

  start = new Date()

  hc = new HashCash numBits, "../browser/hashcash_worker.min.js"
  hc.generate resource,
    (hashcash) -> updateData start, hashcash

setNumBits = ->
  return unless status is STATUS_STOPPED or newNumBits?
  if newNumBits?
    numBits = newNumBits
    newNumBits = undefined
  reset()

reset = ->
  hc = new HashCash numBits
  results =
    num: 0
    duration: 0
    min: undefined
    max: undefined
  updateResults()

updateResults = ->
  averageDuration = 0

  if results.num
    averageDuration = results.duration / results.num

  $("#test-number").text results.num
  $("#average-duration").text averageDuration
  $("#minimum-duration").text results.min
  $("#maximum-duration").text results.max

load = ->
  setNumBits()
  $("#num-bits").val numBits

load()
