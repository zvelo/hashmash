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
        dest: "example/js"
        ext: ".js"

    ## TODO(jrubin) coffeelint

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
        src: "*.js"
        dest: "browser"
        ext: ".min.js"

    cafemocha:
      options:
        reporter: "list"
        colors: false
        require: "should"
        timeout: 5000
      src: "test/*.coffee"

  grunt.loadNpmTasks "grunt-browserify"
  grunt.loadNpmTasks "grunt-cafe-mocha"
  grunt.loadNpmTasks "grunt-contrib-clean"
  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-contrib-concat"
  grunt.loadNpmTasks "grunt-contrib-uglify"

  grunt.registerTask "test", [
    "cafemocha"
  ]

  grunt.registerTask "default", [
    "clean"
    "coffee"
    "browserify"
    "concat"
    "uglify"
    "clean:tmp"
    "test"
  ]
