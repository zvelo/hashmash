"use strict"

define [
  "./copyright"
  "../hashcash"
  "../taskmaster"
], (cc, HashCash, taskmaster) ->
  { WebTaskMaster, TimeoutTaskMaster } = taskmaster

  if Worker?
    ## browser with web workers
    HashCash.TaskMaster       =     WebTaskMaster
    HashCash.BackupTaskMaster = TimeoutTaskMaster
  else
    ## other browser
    HashCash.TaskMaster = TimeoutTaskMaster

  return HashCash
