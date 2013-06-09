"use strict"

tests = Object.keys(window.__karma__.files).filter (file) ->
  return /^\/base\/test\/lib\/tests\/.*\.js$/.test file

relRootDir = "../../.."

requirejs.config
  baseUrl: "/base/test/lib/tests"
  enforceDefine: true
  paths:
    chai:     "#{relRootDir}/node_modules/chai/chai"
    HashCash: "#{relRootDir}/browser/hashcash"
  deps: [ "chai" ]
  callback: (chai) ->
    chai.should()
    requirejs tests, -> window.__karma__.start()
