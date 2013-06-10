"use strict"

path      = require "path"
requirejs = require "requirejs"

requirejs.config
  baseUrl: path.join __dirname, ".."
  nodeRequire: require

HashMash            = requirejs "./hashmash"
HashMash.TaskMaster = requirejs "./node/taskmaster"

module.exports = HashMash
