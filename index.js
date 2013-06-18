/*jslint nomen: true */
/*global require, __dirname, module */

// main entry point for node.js

(function () {
    "use strict";

    var requirejs = require("requirejs"),
        path      = require("path"),
        HashMash;

    requirejs.config({
        baseUrl:     path.join(__dirname, "lib"),
        nodeRequire: require
    });

    HashMash = requirejs("./hashmash");
    HashMash.TaskMaster = requirejs("./node/taskmaster");

    module.exports = HashMash;
}());
