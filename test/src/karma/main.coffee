"use strict"

tests = Object.keys(window.__karma__.files).filter (file) ->
  return /^\/base\/test\/lib\/amd\/.*\.js$/.test file

relRootDir = "../../.."

requirejs.config
  baseUrl: "/base/test/lib/amd"
  enforceDefine: true
  paths:
    chai:     "#{relRootDir}/node_modules/chai/chai"
    HashMash: "#{relRootDir}/amd/hashmash"
  deps: [ "chai" ]
  callback: (chai) ->
    chai.should()
    requirejs tests, -> window.__karma__.start()
