BROWSERIFY = ../node_modules/.bin/browserify
UGLIFYJS = ../node_modules/.bin/uglifyjs

objects = hashcash.js hashcash.min.js hashcash_worker.js hashcash_worker.min.js

all: browser

../lib/hashcash.js:
	$(MAKE) -C ../lib hashcash.js

hashcash.js: ../lib/hashcash.js
	$(BROWSERIFY) -s hashcash ../lib/hashcash.js | cat copyright.js - > hashcash.js

hashcash.min.js: hashcash.js
	$(UGLIFYJS) -v hashcash.js | cat copyright.js - > hashcash.min.js

hashcash_worker.js: ../lib/worker.js
	$(BROWSERIFY) ../lib/worker.js | cat copyright.js - > hashcash_worker.js

hashcash_worker.min.js: hashcash_worker.js
	$(UGLIFYJS) -v hashcash_worker.js | cat copyright.js - > hashcash_worker.min.js

browser: hashcash.min.js hashcash_worker.min.js

clean:
	@echo "cleaning browser"
	-$(RM) $(objects)
	$(MAKE) -C ../lib clean

.PHONY: all browser clean
