module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON "package.json"

    env:
      karma:
        PHANTOMJS_BIN: "./node_modules/.bin/phantomjs"

    clean:
      lib: "lib"
      browser: "browser"
      example: [ "example/public/js/*.js", "example/public/js/*.map" ]
      #karma: "test/browser/tmp"

    coffee:
      options:
        sourceMap: true

      main:
        expand: true
        cwd: "src"
        src: [ "*.coffee", "**/*.coffee" ]
        dest: "lib"
        ext: ".js"

      example:
        expand: true
        flatten: true
        cwd: "example/src"
        src: "*.coffee"
        dest: "example/public/js"
        ext: ".js"

      #karma:
      #  expand: true
      #  flatten: true
      #  cwd: "test/"
      #  src: "*.coffee"
      #  dest: "test/browser/tmp"
      #  ext: ".js"

    requirejs:
      options:
        baseUrl: "lib"
        name: "almond"
        generateSourceMaps: true
        preserveLicenseComments: false
        paths:
          almond: "../node_modules/almond/almond"
        optimize: "uglify2"
        wrap: true
        uglify2:
          output:
            comments: (node, comment) ->
              text = comment.value
              type = comment.type
              if type is "comment2"
                ## multiline comment
                return /@preserve|@license|@cc_on/i.test text


      hashcash:
        options:
          include: [ "browser/main" ]
          out: "browser/hashcash.min.js"
          wrap:
            startFile: "src/browser/hashcash.start.frag"
            endFile: "src/browser/hashcash.end.frag"

      hashcash_worker:
        options:
          include: [ "browser/worker" ]
          insertRequire: [ "browser/worker" ]
          out: "browser/hashcash_worker.min.js"

      #karma:
      #  options:
      #    expand: true
      #    flatten: true
      #    cwd: "test/browser/tmp"
      #    src: "*.js"
      #    dest: "test/browser"
      #    ext: ".js"

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
        no_backticks: level: "ignore"
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

    cafemocha:
      options:
        reporter: "list"
        colors: false
      src: "test/*.coffee"

    karma:
      options:
        configFile: "test/karma.conf.js"
      browser:
        background: true
      continuous:
        singleRun: true
        port: 9877
        runnerPort: 9101
        browsers: [ "PhantomJS" ]

    reallyWatch:
      src:
        files: "src/*.coffee"
        tasks: [ "coffeelint:src", "build:main", "watchTest" ]
      example:
        files: [ "example/*.coffee", "example/src/*.coffee" ]
        tasks: [ "coffeelint:example", "build:example" ]
      test:
        files: [ "test/*.coffee", "!test/browser_*.coffee" ]
        tasks: [ "build:karma", "coffeelint:test", "watchTest" ]
      browserTest:
        files: [ "test/browser_*.coffee" ]
        tasks: [ "build:karma", "coffeelint:test", "karma:browser:run" ]
      root:
        files: "*.coffee"
        tasks: "coffeelint:root"

    build:
      main:
        tasks: [ "coffee:main", "requirejs" ]
      example:
        tasks: "coffee:example"
      karma:
        tasks: [
          #"coffee:karma"
          #"requirejs:karma"
          #"clean:karma"
        ]

  grunt.loadNpmTasks "grunt-env"
  grunt.loadNpmTasks "grunt-karma"
  grunt.loadNpmTasks "grunt-cafe-mocha"
  grunt.loadNpmTasks "grunt-coffeelint"
  grunt.loadNpmTasks "grunt-contrib-clean"
  grunt.loadNpmTasks "grunt-contrib-watch"
  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-contrib-requirejs"

  grunt.registerMultiTask "build", "Build project files", ->
    grunt.task.run @data.tasks

  grunt.registerTask "test", [ "cafemocha", "env:karma", "karma:continuous" ]

  grunt.registerTask "example", "Start the example web server", ->
    done = @async() ## by never calling done, the server is kept alive
    require("./example/server").listen()

  grunt.renameTask "watch", "reallyWatch"
  grunt.registerTask "watch", [ "karma:browser", "reallyWatch" ]

  grunt.registerTask "watchTest", [ "cafemocha", "karma:browser:run" ]

  grunt.registerTask "default", [
    "clean"
    "coffeelint"
    "build"
    #"test"
  ]
