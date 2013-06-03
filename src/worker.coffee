HashCash = require("./hashcash").HashCash

if self?
  ## running in a browser with web workers
  self.onmessage = (event) ->
    data = event.data
    HashCash.testSha(data) until data.result?
    self.postMessage data.result
else
  ## running under node
  process.on "message", (data) ->
    HashCash.testSha(data) until data.result?
    process.send data.result
