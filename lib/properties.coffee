"use strict"

READ_ONLY =
  writable:     false
  enumerable:   true
  configurable: false

HIDDEN_READ_ONLY =
  writable:     false
  enumerable:   false
  configurable: false

exports.makeReadOnly = (type) ->
  if Object.defineProperty?
    for own key of type when typeof key is "string" and key[0] is '_'
      Object.defineProperty type, key, enumerable: false
