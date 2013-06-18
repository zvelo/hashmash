(function() {
  "use strict";
  var HashMash, execute, should;

  should = void 0;

  HashMash = void 0;

  execute = function() {
    return describe("hashmash", function() {
      describe("date", function() {
        return it("should match today", function() {
          var date, day, genDay, genMonth, genYear, month, now, year;
          now = new Date();
          year = now.getYear() - 100;
          month = now.getMonth() + 1;
          day = now.getDate();
          date = HashMash.date();
          date.length.should.equal(6);
          genYear = parseInt(date.substr(0, 2), 10);
          genMonth = parseInt(date.substr(2, 2), 10);
          genDay = parseInt(date.substr(4, 2), 10);
          genYear.should.be.within(0, 100);
          genMonth.should.be.within(1, 12);
          genDay.should.be.within(1, 31);
          genYear.should.equal(year);
          genMonth.should.equal(month);
          return genDay.should.equal(day);
        });
      });
      describe("parse", function() {
        var parts;
        parts = {
          version: HashMash.VERSION = 1,
          bits: 20,
          date: parseInt(HashMash.date(), 10),
          rand: Math.random().toString(36).substr(2),
          resource: "abcd",
          counter: 1
        };
        describe("failure", function() {
          return it("should not parse", function() {
            should.not.exist(HashMash.parse());
            should.not.exist(HashMash.parse(""));
            should.not.exist(HashMash.parse("" + parts.version));
            should.not.exist(HashMash.parse("" + parts.version + ":"));
            should.not.exist(HashMash.parse("" + parts.version + ":" + parts.bits));
            should.not.exist(HashMash.parse("" + parts.version + ":" + parts.bits + ":"));
            should.not.exist(HashMash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date)));
            should.not.exist(HashMash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":")));
            should.not.exist(HashMash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":" + parts.resource)));
            should.not.exist(HashMash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":" + parts.resource + ":")));
            should.not.exist(HashMash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":" + parts.resource + "::")));
            should.not.exist(HashMash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":" + parts.resource + ":") + ("" + parts.rand)));
            should.not.exist(HashMash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":" + parts.resource + ":") + ("" + parts.rand + ":")));
            return should.not.exist(HashMash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":" + parts.resource + ":") + ("" + parts.rand + ":r")));
          });
        });
        return describe("success", function() {
          return it("should parse", function() {
            var data, str;
            str = HashMash.unparse(parts);
            data = HashMash.parse(str);
            should.exist(data);
            data.should.eql(parts);
            data = HashMash.parse("" + str + ":");
            should.exist(data);
            return data.should.eql(parts);
          });
        });
      });
      return describe("validate", function() {
        var parts;
        parts = {
          version: HashMash.VERSION,
          bits: 16,
          date: HashMash.date(),
          rand: Math.random().toString(36).substr(2),
          resource: "abcd"
        };
        describe("failure", function() {
          return it("should not validate", function(done) {
            var challenge, hc;
            this.timeout(105000);
            hc = new HashMash(parts.bits);
            hc.validate().should.equal(false);
            hc.validate("").should.equal(false);
            hc.validate("", 0).should.equal(false);
            challenge = HashMash.unparse(parts);
            hc.validate(challenge).should.equal(false);
            return hc.generate(parts.resource).then(function(challenge) {
              challenge[0].should.equal("" + HashMash.VERSION);
              HashMash.VERSION.should.be.within(0, 8);
              challenge = "" + (HashMash.VERSION + 1) + (challenge.substr(1));
              hc.validate(challenge).should.equal(false);
              return done();
            }).otherwise(function() {
              return done("HashMash generation failed");
            });
          });
        });
        return describe("success", function() {
          return it("should validate", function(done) {
            var hc;
            this.timeout(30000);
            hc = new HashMash(parts.bits);
            return hc.generate(parts.resource).then(function(challenge) {
              hc.validate(challenge).should.equal(true);
              return done();
            }).otherwise(function() {
              return done("HashMash generation failed");
            });
          });
        });
      });
    });
  };

  define(["chai", "hashmash"], function(chai, hashmash) {
    should = chai.should();
    HashMash = hashmash;
    return execute();
  });

}).call(this);

/*
//@ sourceMappingURL=hashmash_test.js.map
*/