module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON "package.json"

    clean:
      lib: [ "lib/*.js", "lib/*.map" ]
      browser: "browser/*.js"
      example: [ "example/public/js/*.js", "example/public/js/*.map" ]
      tmp: "tmp"
      karma: "test/browser/tmp"

    coffee:
      options:
        sourceMap: true

      src:
        expand: true
        flatten: true
        cwd: "src"
        src: "*.coffee"
        dest: "lib"
        ext: ".js"

      example:
        expand: true
        flatten: true
        cwd: "example/src"
        src: "*.coffee"
        dest: "example/public/js"
        ext: ".js"

      karma:
        expand: true
        flatten: true
        cwd: "test/"
        src: "*.coffee"
        dest: "test/browser/tmp"
        ext: ".js"

    browserify:
      browser:
        options:
          ignore: "os"
          debug: true
        src:  "lib/browser.js"
        dest: "tmp/hashcash.js"

      browser_worker:
        options:
          ignore: "os"
          debug: true
        src:  "lib/worker.js"
        dest: "tmp/hashcash_worker.js"

      karma:
        options:
          debug: true
        expand: true
        flatten: true
        cwd: "test/browser/tmp"
        src: "*.js"
        dest: "test/browser"
        ext: ".js"

    coffeelint:
      options:
        no_tabs: level: "error"
        no_trailing_whitespace: level: "error", allowed_in_comments: false
        max_line_length: value: 80, level: "warn"
        camel_case_classes: level: "error"
        indentation: value: 2, level: "error"
        no_implicit_braces: level: "ignore"
        no_trailing_semicolons: level: "error"
        no_plusplus: level: "warn"
        no_throwing_strings: level: "error"
        cyclomatic_complexity: value: 10, level: "ignore"
        no_backticks: level: "error"
        line_endings: level: "warn", value: "unix"
        no_implicit_parens: level: "ignore"
        empty_constructor_needs_parens: level: "ignore"
        non_empty_constructor_needs_parens: level: "ignore"
        no_empty_param_list: level: "warn"
        space_operators: level: "warn"
        duplicate_key: level: "error"
        newlines_after_classes: value: 3, level: "warn"
        no_stand_alone_at: level: "warn"
        arrow_spacing: level: "warn"
        coffeescript_error: level: "error"
      src: "src/*.coffee"
      test: "test/*.coffee"
      example: [ "example/*.coffee", "example/src/*.coffee" ]
      root: "*.coffee"

    concat:
      copyright:
        nonull: true
        files:
          "browser/hashcash.js": [
            "copyright.js",
            "tmp/hashcash.js"
          ]

          "browser/hashcash_worker.js": [
            "copyright.js",
            "tmp/hashcash_worker.js"
          ]

    uglify:
      options:
        preserveComments: "some"
        banner:
          "/*! <%= pkg.name %> <%= grunt.template.today(\"yyyy-mm-dd\") %> */\n"

      browser:
        expand: true
        flatten: true
        cwd: "browser"
        src: [ "*.js", "!*.min.js" ]
        dest: "browser"
        ext: ".min.js"

    cafemocha:
      options:
        reporter: "list"
        colors: false
      src: "test/*.coffee"

    karma:
      browser:
        configFile: "test/karma.conf.js"
        background: true

    watch:
      src:
        files: "src/*.coffee"
        tasks: [ "coffeelint:src", "build:node", "build:browser", "test" ]
      example:
        files: [ "example/*.coffee", "example/src/*.coffee" ]
        tasks: [ "coffeelint:example", "build:example" ]
      test:
        files: "test/*.coffee"
        tasks: [ "build:karma", "coffeelint:test", "test" ]
      root:
        files: "*.coffee"
        tasks: "coffeelint:root"

    build:
      node:
        tasks: "coffee:src"
      browser:
        tasks: [
          "browserify:browser",
          "browserify:browser_worker",
          "concat:copyright",
          "clean:tmp",
          "minimize"
        ]
      example:
        tasks: "coffee:example"
      karma:
        tasks: [ "coffee:karma", "browserify:karma", "clean:karma" ]

  grunt.loadNpmTasks "grunt-karma"
  grunt.loadNpmTasks "grunt-browserify"
  grunt.loadNpmTasks "grunt-cafe-mocha"
  grunt.loadNpmTasks "grunt-coffeelint"
  grunt.loadNpmTasks "grunt-contrib-clean"
  grunt.loadNpmTasks "grunt-contrib-watch"
  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-contrib-concat"
  grunt.loadNpmTasks "grunt-contrib-uglify"

  grunt.registerTask     "test", [ "karma:browser:run", "cafemocha" ]
  grunt.registerTask "minimize", [ "uglify" ]

  grunt.registerMultiTask "build", "Build project files", ->
    grunt.task.run @data.tasks

  exampleServer = require "./example/server"

  grunt.registerTask "example", "Start the example web server", ->
    done = @async() ## by never calling done, the server is kept alive
    port = process.env.PORT or 3000
    exampleServer.listen port, ->
      grunt.log.writeln "Example server listening on port #{port}"

  grunt.registerTask "default", [
    "clean"
    "coffeelint"
    "build"
    "test"
  ]
