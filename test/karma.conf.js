// Karma configuration
// Generated on Sun Jan 12 2014 01:23:09 GMT-0700 (MST)

module.exports = function(config) {
  config.set({

    // base path, that will be used to resolve files and exclude
    basePath: "..",


    // frameworks to use
    frameworks: [ "mocha", "requirejs" ],


    // list of files / patterns to load in the browser
    files: [
      // node modules to include
      { pattern: "node_modules/chai/chai.js", included: false },
      { pattern: "node_modules/when/when.js", included: false },

      // the module files
      { pattern: "*.min.js", included: false },

      // polyfills
      { pattern: "lib/poly/*.js", included: false },
      { pattern: "lib/poly/**/*.js", included: false },

      // the actual test files
      { pattern: "test/lib/amd/*.js",    included: false },
      { pattern: "test/lib/amd/karma/*.js", included: false },

      // for test setup and execution
      "test/lib/karma.js"
    ],


    // list of files to exclude
    exclude: [],


    // test results reporter to use
    // possible values: "dots", "progress", "junit", "growl", "coverage"
    reporters: [ "progress" ],

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: [ "Chrome" ],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
