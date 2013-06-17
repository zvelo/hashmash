(function() {
  "use strict";
  define(["./copyright", "../hashmash", "../taskmaster"], function(cc, HashMash, taskmaster) {
    var TimeoutTaskMaster, WebTaskMaster;
    WebTaskMaster = taskmaster.WebTaskMaster, TimeoutTaskMaster = taskmaster.TimeoutTaskMaster;
    if (typeof Worker !== "undefined" && Worker !== null) {
      HashMash.TaskMaster = WebTaskMaster;
      HashMash.BackupTaskMaster = TimeoutTaskMaster;
    } else {
      HashMash.TaskMaster = TimeoutTaskMaster;
    }
    return HashMash;
  });

}).call(this);

/*
//@ sourceMappingURL=main.js.map
*/