/*global define, window */

// main entry point for require.js

(function () {
    "use strict";

    define(["./lib/hashmash", "./lib/taskmaster"],
        function (HashMash, taskmaster) {
            var WebTaskMaster     = taskmaster.WebTaskMaster,
                TimeoutTaskMaster = taskmaster.TimeoutTaskMaster;

            if (!!window.Worker) {
                // browser with web workers
                HashMash.TaskMaster = WebTaskMaster;
                HashMash.BackupTaskMaster = TimeoutTaskMaster;
            } else {
                // other browser
                HashMash.TaskMaster = TimeoutTaskMaster;
            }

            return HashMash;
        });
}());
