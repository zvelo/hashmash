module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON "package.json"

    clean:
      lib: [ "lib/*.js", "lib/**/*.js", "!lib/poly/*.js", "!lib/poly/**/*.js" ]
      optimized: "*.min.js"
      example: [ "example/public/js/*.js", "example/public/js/*.map" ]
      test: [ "test/lib/*" ]

    coffee:
      options:
        sourceMap: true

      lib:
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

      test:
        expand: true
        cwd: "test/src"
        src: "*.coffee"
        dest: "test/lib"
        ext: ".js"

    testFiles:
      testType: [ "node", "amd" ]

    requirejs:
      options:
        baseUrl: "."
        name: "almond"
        generateSourceMaps: true
        preserveLicenseComments: false
        paths:
          almond: "../node_modules/almond/almond"
        packages: [
          name:     "when"
          location: "../node_modules/when"
          main:     "when"
        ,
          name:     "poly"
          location: "poly"
          main:     "poly"
        ]
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

      hashmash:
        options:
          include: [ "lib/poly/function", "copyright", "main" ]
          out: "hashmash.min.js"
          wrap:
            startFile: "src/hashmash.start.frag"
            endFile: "src/hashmash.end.frag"

      hashmash_worker:
        options:
          include: [ "copyright", "worker" ]
          insertRequire: [ "worker" ]
          out: "worker.min.js"

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
      src: [ "src/*.coffee", "src/**/*.coffee" ]
      example: [ "example/*.coffee", "example/src/*.coffee" ]
      test: [ "test/src/**/*.coffee", "test/src/**/**/*.coffee" ]
      root: "*.coffee"

    cafemocha:
      options:
        reporter: "list"
        colors: false
      node: "test/lib/node/*.js"
      amd: "test/lib/mocha.js"

    karma:
      options:
        configFile: "test/karma.conf.js"
      amd:
        background: true
      continuous:
        singleRun: true
        port: 9877
        runnerPort: 9101
        browsers: [ "PhantomJS" ]

    reallyWatch:
      main:
        files: "*.coffee"
        tasks: "watchTest"
      src:
        files: [ "src/*.coffee", "src/**/*.coffee" ]
        tasks: [ "coffeelint:src", "build:lib", "watchTest" ]
      example:
        files: [ "example/*.coffee", "example/src/*.coffee" ]
        tasks: [ "coffeelint:example", "build:example" ]
      test:
        files: [ "test/src/**/*.coffee", "test/src/**/**/*.coffee" ]
        tasks: [ "coffeelint:test", "build:test", "watchTest" ]

    build:
      lib:
        tasks: [ "coffee:lib", "requirejs" ]
      example:
        tasks: "coffee:example"
      test:
        tasks: [ "testFiles", "coffee:test" ]

  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-contrib-requirejs"

  unless process.env.NODE_ENV is "production"
    try
      grunt.loadNpmTasks "grunt-karma"
      grunt.loadNpmTasks "grunt-cafe-mocha"
      grunt.loadNpmTasks "grunt-coffeelint"
      grunt.loadNpmTasks "grunt-contrib-clean"
      grunt.loadNpmTasks "grunt-contrib-watch"

      grunt.renameTask   "watch", "reallyWatch"
      grunt.registerTask "watch", [ "karma:amd", "reallyWatch" ]

      process.env.PHANTOMJS_BIN = require("phantomjs").path

  grunt.registerMultiTask "build", "Build project files", ->
    grunt.task.run @data.tasks

  grunt.registerTask "clearNodeCache", "Clear the node require.cache", ->
    for own key of require.cache
      continue unless /\/requirejs\/bin\/r\.js$/.test key
      delete require.cache[key]

  grunt.registerTask "test", [
    "clearNodeCache"
    "cafemocha",
    "karma:continuous",
  ]

  grunt.registerTask "watchTest", [
    "clearNodeCache"
    "cafemocha"
    "karma:amd:run"
  ]

  grunt.registerTask "example", "Start the example web server", ->
    done = @async() ## by never calling done, the server is kept alive
    require("./example/server").listen()

  grunt.registerMultiTask "testFiles", "Concat and build all test files", ->
    baseDir = "test/src/base"
    config = grunt.config "coffee"

    for testType in @data
      testDir = "test/src/#{testType}"
      destDir = "test/lib/#{testType}"

      tests = grunt.file.expand [
        "#{testDir}/*.coffee"
        "#{testDir}/**/*.coffee"
      ]

      for test in tests
        testName = test[testDir.length + 1 .. test.lastIndexOf('.') - 1]
        base = "#{baseDir}/#{testName}.coffee"
        dest = "#{destDir}/#{testName}.js"

        config.testFiles ?=
          options:
            join: true
          files: {}

        config.testFiles.files[dest] = [ base, test ]

        grunt.config "coffee", config

    grunt.task.run "coffee:testFiles"

  grunt.registerTask "default", [
    "clean"
    "coffeelint"
    "build"
    "test"
  ]
