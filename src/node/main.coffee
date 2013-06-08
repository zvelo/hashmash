"use strict"

path      = require "path"
requirejs = require "requirejs"

requirejs.config
  baseUrl: path.join __dirname, ".."
  nodeRequire: require

HashCash = requirejs "./hashcash"
throw new Error "Unable to load HashCash" unless HashCash?

HashCash.TaskMaster = require "./taskmaster"

module.exports = HashCash
