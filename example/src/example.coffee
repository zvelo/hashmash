define [ "jquery", "hashmash" ], ($, HashMash) ->
  resource = "zvelo.com"

  WORKER_FILE = "js/hashmash_worker.js"

  class Tester
    @STATUS_STOPPED: 0
    @STATUS_RUNNING: 1

    constructor: ->
      @status = Tester.STATUS_STOPPED
      @reset()

    toggle: ->
      switch @status
        when Tester.STATUS_STOPPED then @start true
        when Tester.STATUS_RUNNING then @stop()
        else console.error "toggle from unknown state", @status

    _hashMashCallback: (hashmash) ->
      duration = (new Date() - @_startTime) / 1000
      @_results.min = duration if not @_results.min? or duration < @_results.min
      @_results.max = duration if not @_results.max? or duration > @_results.max
      @_results.duration += duration

      @_updateResults hashmash, duration

      parsed = HashMash.parse hashmash

      if @_results.rands.hasOwnProperty(parsed.rand)
        console.error "repeated hashmash"

      @_results.rands[parsed.rand] = true

      if @_results.num < @_numTests
        #console.log "starting test #{@_results.num}"
        @start()
      else
        console.log "test finished"
        @stop()

    start: (reset) ->
      return unless resource.length and @_hc

      if reset?
        @status = Tester.STATUS_RUNNING
        @_results.num = 0

      return unless @status is Tester.STATUS_RUNNING

      $("#toggle-status")
        .text("Stop")
        .addClass("btn-danger")
        .removeClass("btn-primary")

      $("#num-tests").attr "disabled", "disabled"
      $("#status").text "running"

      @_results.num += 1
      @_results.total_num += 1

      @_startTime = new Date()

      try
        @_hc.generate resource
      catch e
        console.error "error", e, e.stack

    stop: ->
      return unless @_hc? and @status is Tester.STATUS_RUNNING

      console.log "stopping"

      @_hc.stop()

      @status = Tester.STATUS_STOPPED

      $("#toggle-status")
        .text("Start")
        .addClass("btn-primary")
        .removeClass("btn-danger")

      $("#num-tests").removeAttr "disabled"
      $("#status").text "stopped"

    setNumTests: (elem) ->
      @_numTests  = $("#num-tests").val()
      console.log "setNumTests", @_numTests

    reset: ->
      @stop()

      ## load data from document
      @_numTests  = $("#num-tests").val()
      @_numBits   = $("#num-bits").val()
      @_noWorkers = $("#no-workers").is ":checked"
      @_numWorkers = $("#num-workers").val()

      if @_noWorkers
        $("#num-workers").attr "disabled", "disabled"
      else
        $("#num-workers").removeAttr "disabled"

      console.log "loaded numTests", @_numTests,
                  "numBits", @_numBits,
                  "noWorkers", @_noWorkers,
                  "numWorkers", @_numWorkers

      workerFile = if @_noWorkers then undefined else WORKER_FILE

      @_hc = new HashMash @_numBits,
                          @_hashMashCallback,
                          this,
                          workerFile,
                          @_numWorkers

      @_results =
        num: 0
        total_num: 0
        duration: 0
        min: undefined
        max: undefined
        rands: {}

      @_updateResults()

    _updateResults: (hashmash, duration) ->
      averageDuration = 0

      if @_results.total_num
        valid = @_hc.validate hashmash
        averageDuration = @_results.duration / @_results.total_num
        console.log "test", @_results.total_num,
                    hashmash, HashMash.hash(hashmash),
                    "valid", valid,
                    "duration", duration,
                    "status", @status,
                    "average duration", averageDuration

      $("#test-number").text @_results.total_num
      $("#average-duration").text averageDuration
      $("#minimum-duration").text if @_results.min? then @_results.min else 0
      $("#maximum-duration").text if @_results.max? then @_results.max else 0

  window.tester = new Tester
