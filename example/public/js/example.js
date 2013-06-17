(function() {
  define(["hashmash"], function(HashMash) {
    var Tester, WORKER_FILE, resource;
    resource = "zvelo.com";
    WORKER_FILE = "js/hashmash_worker.js";
    Tester = (function() {
      Tester.STATUS_STOPPED = 0;

      Tester.STATUS_RUNNING = 1;

      function Tester() {
        this.status = Tester.STATUS_STOPPED;
        this.reset();
      }

      Tester.prototype.toggle = function() {
        switch (this.status) {
          case Tester.STATUS_STOPPED:
            return this.start(true);
          case Tester.STATUS_RUNNING:
            return this.stop();
          default:
            return console.error("toggle from unknown state", this.status);
        }
      };

      Tester.prototype._hashMashCallback = function(hashmash) {
        var duration, parsed;
        duration = (new Date() - this._startTime) / 1000;
        if ((this._results.min == null) || duration < this._results.min) {
          this._results.min = duration;
        }
        if ((this._results.max == null) || duration > this._results.max) {
          this._results.max = duration;
        }
        this._results.duration += duration;
        this._updateResults(hashmash, duration);
        parsed = HashMash.parse(hashmash);
        if (this._results.rands.hasOwnProperty(parsed.rand)) {
          console.error("repeated hashmash");
        }
        this._results.rands[parsed.rand] = true;
        if (this._results.num < this._numTests) {
          return this.start();
        } else {
          console.log("test finished");
          return this.stop();
        }
      };

      Tester.prototype.start = function(reset) {
        if (!(resource.length && this._hc)) {
          return;
        }
        if (reset != null) {
          this.status = Tester.STATUS_RUNNING;
          this._results.num = 0;
        }
        if (this.status !== Tester.STATUS_RUNNING) {
          return;
        }
        $("#toggle-status").text("Stop").addClass("btn-danger").removeClass("btn-primary");
        $("#num-tests").attr("disabled", "disabled");
        $("#status").text("running");
        this._results.num += 1;
        this._results.total_num += 1;
        this._startTime = new Date();
        return this._hc.generate(resource).then(this._hashMashCallback.bind(this)).otherwise(function(e) {
          return console.error("error", e, e.stack);
        });
      };

      Tester.prototype.stop = function() {
        if (!((this._hc != null) && this.status === Tester.STATUS_RUNNING)) {
          return;
        }
        console.log("stopping");
        this._hc.stop();
        this.status = Tester.STATUS_STOPPED;
        $("#toggle-status").text("Start").addClass("btn-primary").removeClass("btn-danger");
        $("#num-tests").removeAttr("disabled");
        return $("#status").text("stopped");
      };

      Tester.prototype.setNumTests = function(elem) {
        this._numTests = $("#num-tests").val();
        return console.log("setNumTests", this._numTests);
      };

      Tester.prototype.reset = function() {
        var workerFile;
        this.stop();
        this._numTests = $("#num-tests").val();
        this._numBits = $("#num-bits").val();
        this._noWorkers = $("#no-workers").is(":checked");
        this._numWorkers = $("#num-workers").val();
        if (this._noWorkers) {
          $("#num-workers").attr("disabled", "disabled");
        } else {
          $("#num-workers").removeAttr("disabled");
        }
        console.log("loaded numTests", this._numTests, "numBits", this._numBits, "noWorkers", this._noWorkers, "numWorkers", this._numWorkers);
        workerFile = this._noWorkers ? void 0 : WORKER_FILE;
        this._hc = new HashMash(this._numBits, workerFile, this._numWorkers);
        this._results = {
          num: 0,
          total_num: 0,
          duration: 0,
          min: void 0,
          max: void 0,
          rands: {}
        };
        return this._updateResults();
      };

      Tester.prototype._updateResults = function(hashmash, duration) {
        var averageDuration, valid;
        averageDuration = 0;
        if (this._results.total_num) {
          valid = this._hc.validate(hashmash);
          averageDuration = this._results.duration / this._results.total_num;
          console.log("test", this._results.total_num, hashmash, HashMash.hash(hashmash), "valid", valid, "duration", duration, "status", this.status, "average duration", averageDuration);
        }
        $("#test-number").text(this._results.total_num);
        $("#average-duration").text(averageDuration);
        $("#minimum-duration").text(this._results.min != null ? this._results.min : 0);
        return $("#maximum-duration").text(this._results.max != null ? this._results.max : 0);
      };

      return Tester;

    })();
    return window.tester = new Tester;
  });

}).call(this);

/*
//@ sourceMappingURL=example.js.map
*/