"use strict"

tests = Object.keys(window.__karma__.files).filter (file) ->
  return /^\/base\/test\/lib\/amd\/.*\.js$/.test file

relRootDir = "../../.."

requirejs.config
  baseUrl: "/base/test/lib/amd"
  enforceDefine: true
  paths:
    chai:     "#{relRootDir}/node_modules/chai/chai"
    hashmash: "#{relRootDir}/hashmash.min"
  packages: [
    name:     "when"
    location: "#{relRootDir}/node_modules/when"
    main:     "when"
  ,
    name:     "poly"
    location: "#{relRootDir}/lib/poly"
    main:     "poly"
  ]
  deps: [ "poly/function" ]
  callback: -> requirejs tests, -> window.__karma__.start()
