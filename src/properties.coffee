READ_ONLY =
  writable:     false
  enumerable:   true
  configurable: false

HIDDEN_READ_ONLY =
  writable:     false
  enumerable:   false
  configurable: false

HIDDEN =
  writable:     true
  enumerable:   false
  configurable: false

exports.makeReadOnly = (type) ->
  return undefined unless Object.defineProperty?

  for own key of type
    mode = READ_ONLY
    mode = HIDDEN_READ_ONLY if key[0] is '_'

    Object.defineProperty type, key, mode

  return undefined

exports.makeHidden = (type) ->
  return undefined unless Object.defineProperty?

  for own key of type
    if key[0] is '_'
      mode = HIDDEN
      mode = HIDDEN_READ_ONLY if typeof type[key] is "function"
    else if typeof type[key] is "function"
      mode = READ_ONLY

    continue unless mode?
    Object.defineProperty type, key, mode
    mode = undefined

  return undefined
