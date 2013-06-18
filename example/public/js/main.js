/*global require */

(function() {
    "use strict";

    require.config({
        baseUrl: "js",
        paths: {
            jquery: "//ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min"
        },
        packages: [{
            name: "poly",
            location: "poly",
            main: "poly"
        }, {
            name: "hashmash",
            location: "hashmash",
            main: "hashmash"
        }],
        deps: ["poly/function", "jquery"],
        callback: function() {
            return require(["example"]);
        }
    });
}());
