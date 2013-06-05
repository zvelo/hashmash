module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON "package.json"

    clean:
      lib: "lib/*.js"
      browser: "browser/*.js"
      tmp: "tmp/"

    coffee:
      lib:
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

    browserify:
      hashcash:
        options:
          ignore: "os"
          standalone: "hashcash"
        src:  "lib/hashcash.js"
        dest: "tmp/hashcash.js"

      hashcash_worker:
        options:
          ignore: "os"
        src:  "lib/worker.js"
        dest: "tmp/hashcash_worker.js"

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
        require: "should"
        timeout: 5000
      src: "test/*.coffee"

    watch:
      src:
        files: "src/*.coffee"
        tasks: [ "coffeelint:src", "coffee:lib" ]
      browser:
        files: "lib/*.js"
        tasks: [ "browserify", "concat:copyright", "clean:tmp" ]
      example:
        files: [ "example/*.coffee", "example/src/*.coffee" ]
        tasks: [ "coffeelint:example", "coffee:example" ]
      min:
        files: [ "browser/*.js", "!browser/*.min.js" ]
        tasks: "uglify"
      test:
        files: "test/*.coffee"
        tasks: [ "coffeelint:test", "test" ]
      root:
        files: "*.coffee"
        tasks: "coffeelint:root"

  grunt.loadNpmTasks "grunt-browserify"
  grunt.loadNpmTasks "grunt-cafe-mocha"
  grunt.loadNpmTasks "grunt-coffeelint"
  grunt.loadNpmTasks "grunt-contrib-clean"
  grunt.loadNpmTasks "grunt-contrib-watch"
  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-contrib-concat"
  grunt.loadNpmTasks "grunt-contrib-uglify"

  grunt.registerTask "test", [
    "cafemocha"
  ]

  grunt.registerTask "lint", [
    "coffeelint"
  ]

  grunt.registerTask "default", [
    "clean"
    "lint"
    "coffee"
    "browserify"
    "concat"
    "uglify"
    "clean:tmp"
    "test"
  ]
