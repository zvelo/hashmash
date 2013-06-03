DIRS = lib browser example

all: browser example

lib:
	$(MAKE) -C lib

browser: lib
	$(MAKE) -C browser

example: browser
	$(MAKE) -C example

clean:
	@for d in $(DIRS); do \
		(cd $$d && $(MAKE) clean); \
	done

test: all
	./node_modules/.bin/mocha -C --reporter list

.PHONY: all lib browser example clean test
