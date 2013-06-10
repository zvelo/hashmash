"use strict"

tests = Object.keys(window.__karma__.files).filter (file) ->
  return /^\/base\/test\/lib\/requirejs\/.*\.js$/.test file

relRootDir = "../../.."

requirejs.config
  baseUrl: "/base/test/lib/requirejs"
  enforceDefine: true
  paths:
    chai:     "#{relRootDir}/node_modules/chai/chai"
    HashMash: "#{relRootDir}/browser/hashmash"
  deps: [ "chai" ]
  callback: (chai) ->
    chai.should()
    requirejs tests, -> window.__karma__.start()
