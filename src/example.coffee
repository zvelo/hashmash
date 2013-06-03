HASH_CASH_NUM_BITS = 19
MAX_TESTS = 100

resource = "zvelo.com"

HashCash = hashcash.HashCash
hc = new HashCash HASH_CASH_NUM_BITS
stop = false

results =
  num: 0
  duration: 0
  min: undefined
  max: undefined

$("#complexity").text HASH_CASH_NUM_BITS

window.start = ->
  stop = false
  $("#status").text "running"
  test()

window.stop = ->
  return if results.num >= MAX_TESTS
  $("#status").text "stopping"
  stop = true

updateData = (start, hashcash) ->
  valid = hc.validate hashcash
  duration = (new Date() - start) / 1000
  results.min = duration if not results.min? or duration < results.min
  results.max = duration if not results.max? or duration > results.max
  results.duration += duration
  results.num += 1
  averageDuration = results.duration / results.num

  $("#test-number").text results.num
  $("#average-duration").text averageDuration
  $("#minimum-duration").text results.min
  $("#maximum-duration").text results.max

  console.log "test", results.num,
              hashcash, HashCash.hash(hashcash),
              "valid", valid,
              "duration", duration

  if stop
    $("#status").text "stopped"
  else if results.num < MAX_TESTS
    test()

test = ->
  return if not resource.length

  start = new Date()

  hc = new HashCash HASH_CASH_NUM_BITS, "../browser/hashcash_worker.min.js"
  hc.generate resource,
    (hashcash) -> updateData start, hashcash
