(function() {
  "use strict";
  define(["./copyright", "../hashcash", "../taskmaster"], function(cc, HashCash, taskmaster) {
    var TimeoutTaskMaster, WebTaskMaster;
    WebTaskMaster = taskmaster.WebTaskMaster, TimeoutTaskMaster = taskmaster.TimeoutTaskMaster;
    if (typeof Worker !== "undefined" && Worker !== null) {
      HashCash.TaskMaster = WebTaskMaster;
      HashCash.BackupTaskMaster = TimeoutTaskMaster;
    } else {
      HashCash.TaskMaster = TimeoutTaskMaster;
    }
    return HashCash;
  });

}).call(this);

/*
//@ sourceMappingURL=main.js.map
*/