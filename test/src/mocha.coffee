"use strict"

fs        = require "fs"
path      = require "path"
requirejs = require "requirejs"

relRootDir = "../.."
rootDir = path.join __dirname, relRootDir
baseDir = path.join rootDir, "test/lib/amd"

findTests = (base, dir) ->
  tests = []
  for name in fs.readdirSync path.join(base, dir)
    continue if name[0] is '.'

    file = "#{dir}/#{name}"
    stats = fs.statSync path.join(base, file)

    if stats.isFile()
      extension = name[name.lastIndexOf('.') ..]
      continue unless extension is ".js"

      test = file[.. file.lastIndexOf('.') - 1]

      tests.unshift test

  return tests

tests = findTests baseDir, "."

requirejs.config
  baseUrl: baseDir
  enforceDefine: true
  paths:
    chai:     "#{relRootDir}/node_modules/chai/chai"
    hashmash: "#{relRootDir}/hashmash"

describe "TestRunner", ->
  it "should run all tests", (done) ->
    requirejs tests, -> done()
