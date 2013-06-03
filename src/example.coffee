HASH_CASH_NUM_BITS = 19
MAX_TESTS = 100

HashCash = hashcash.HashCash
resource = "zvelo.com"

results =
  num: 0
  duration: 0
  min: undefined
  max: undefined
  stop: false

window.stop = ->
  return if results.num >= MAX_TESTS
  $("body").append("<p>stopping...</p>")
  results.stop = true

updateData = (start, hashcash) ->
  str = "<pre>" +
        "test number: #{results.num + 1}<br>" +
        "hashcash: #{hashcash}<br>" +
        "sha: #{HashCash.hash(hashcash)}<br>"

  hc = new HashCash HASH_CASH_NUM_BITS
  valid = hc.validate hashcash

  str += "valid: #{valid}<br>"

  duration = (new Date() - start) / 1000

  results.min = duration if not results.min? or duration < results.min
  results.max = duration if not results.max? or duration > results.max

  results.duration += duration
  results.num += 1
  averageDuration = results.duration / results.num

  str += "duration: #{duration}<br>" +
         "average: #{averageDuration}<br>" +
         "min: #{results.min}<br>" +
         "max: #{results.max}<br>" +
         "</pre>"

  $("body").append str

  if results.stop
    $("body").append("<p>stopped</p>")
  else if results.num < MAX_TESTS
    test()

test = ->
  return if not resource.length

  start = new Date()

  hc = new HashCash HASH_CASH_NUM_BITS, "../browser/hashcash_worker.min.js"
  hc.generate resource,
    (hashcash) -> updateData start, hashcash

test()
