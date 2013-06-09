"use strict"

path      = require "path"
requirejs = require "requirejs"

requirejs.config
  baseUrl: path.join __dirname, ".."
  nodeRequire: require

HashCash            = requirejs "./hashcash"
HashCash.TaskMaster = requirejs "./node/taskmaster"

module.exports = HashCash
