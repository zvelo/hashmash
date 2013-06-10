"use strict"

define [
  "./copyright"
  "../hashmash"
  "../taskmaster"
], (cc, HashMash, taskmaster) ->
  { WebTaskMaster, TimeoutTaskMaster } = taskmaster

  if Worker?
    ## browser with web workers
    HashMash.TaskMaster       =     WebTaskMaster
    HashMash.BackupTaskMaster = TimeoutTaskMaster
  else
    ## other browser
    HashMash.TaskMaster = TimeoutTaskMaster

  return HashMash
