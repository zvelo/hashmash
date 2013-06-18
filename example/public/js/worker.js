(function() {
  importScripts("require.js");

  require.config({
    baseUrl: ".",
    packages: [
      {
        name: "poly",
        location: "poly",
        main: "poly"
      }, {
        name: "hashmash_worker",
        location: "hashmash",
        main: "worker"
      }
    ],
    deps: ["poly/function"],
    callback: function() {
      return require(["hashmash_worker"]);
    }
  });

}).call(this);

/*
//@ sourceMappingURL=worker.js.map
*/