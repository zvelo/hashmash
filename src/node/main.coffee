"use strict"

path = require "path"
requirejs = require "requirejs"

requirejs.config
  baseUrl: path.join __dirname, ".."
  nodeRequire: require

HashCash            = requirejs "./hashcash"
HashCash.TaskMaster = require "./taskmaster"

module.exports = HashCash
