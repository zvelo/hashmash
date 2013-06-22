expect = undefined
sha1   = undefined

define [ "chai", "hashmash" ], (chai, HashMash) ->
  expect = chai.expect
  sha1   = HashMash
  execute()
