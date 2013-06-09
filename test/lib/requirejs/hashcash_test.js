(function() {
  "use strict";
  var HashCash, execute, should;

  should = void 0;

  HashCash = void 0;

  execute = function() {
    return describe("hashcash", function() {
      describe("date", function() {
        return it("should match today", function() {
          var date, day, genDay, genMonth, genYear, month, now, year;
          now = new Date();
          year = now.getYear() - 100;
          month = now.getMonth() + 1;
          day = now.getDate();
          date = HashCash.date();
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
          version: HashCash.VERSION = 1,
          bits: 20,
          date: parseInt(HashCash.date(), 10),
          rand: Math.random().toString(36).substr(2),
          resource: "abcd",
          counter: 1
        };
        describe("failure", function() {
          return it("should not parse", function() {
            should.not.exist(HashCash.parse());
            should.not.exist(HashCash.parse(""));
            should.not.exist(HashCash.parse("" + parts.version));
            should.not.exist(HashCash.parse("" + parts.version + ":"));
            should.not.exist(HashCash.parse("" + parts.version + ":" + parts.bits));
            should.not.exist(HashCash.parse("" + parts.version + ":" + parts.bits + ":"));
            should.not.exist(HashCash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date)));
            should.not.exist(HashCash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":")));
            should.not.exist(HashCash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":" + parts.resource)));
            should.not.exist(HashCash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":" + parts.resource + ":")));
            should.not.exist(HashCash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":" + parts.resource + "::")));
            should.not.exist(HashCash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":" + parts.resource + ":") + ("" + parts.rand)));
            should.not.exist(HashCash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":" + parts.resource + ":") + ("" + parts.rand + ":")));
            return should.not.exist(HashCash.parse(("" + parts.version + ":" + parts.bits + ":") + ("" + parts.date + ":" + parts.resource + ":") + ("" + parts.rand + ":r")));
          });
        });
        return describe("success", function() {
          return it("should parse", function() {
            var data, str;
            str = HashCash.unparse(parts);
            data = HashCash.parse(str);
            should.exist(data);
            data.should.eql(parts);
            data = HashCash.parse("" + str + ":");
            should.exist(data);
            return data.should.eql(parts);
          });
        });
      });
      return describe("validate", function() {
        var parts;
        parts = {
          version: HashCash.VERSION,
          bits: 16,
          date: HashCash.date(),
          rand: Math.random().toString(36).substr(2),
          resource: "abcd"
        };
        describe("failure", function() {
          return it("should not validate", function(done) {
            var cb, challenge, hc;
            this.timeout(105000);
            cb = function(challenge) {
              challenge[0].should.equal("" + HashCash.VERSION);
              HashCash.VERSION.should.be.within(0, 8);
              challenge = "" + (HashCash.VERSION + 1) + (challenge.substr(1));
              hc.validate(challenge).should.equal(false);
              return done();
            };
            hc = new HashCash(parts.bits, cb, this);
            hc.validate().should.equal(false);
            hc.validate("").should.equal(false);
            hc.validate("", 0).should.equal(false);
            challenge = HashCash.unparse(parts);
            hc.validate(challenge).should.equal(false);
            return hc.generate(parts.resource);
          });
        });
        return describe("success", function() {
          return it("should validate", function(done) {
            var cb, hc;
            this.timeout(10000);
            cb = function(challenge) {
              hc.validate(challenge).should.equal(true);
              return done();
            };
            hc = new HashCash(parts.bits, cb, this);
            return hc.generate(parts.resource);
          });
        });
      });
    });
  };

  define(["chai", "HashCash"], function(chai, hashcash) {
    should = chai.should();
    HashCash = hashcash;
    return execute();
  });

}).call(this);

/*
//@ sourceMappingURL=hashcash_test.js.map
*/