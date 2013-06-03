DIRS = lib browser example

all: browser example

lib:
	@echo "making lib"
	$(MAKE) -C lib

browser: lib
	@echo "making browser"
	$(MAKE) -C browser

example: browser
	@echo "making example"
	$(MAKE) -C example

clean:
	@for d in $(DIRS); do \
		(cd $$d && $(MAKE) clean); \
	done

test: all
	./node_modules/.bin/mocha -C --reporter list

.PHONY: all lib browser example clean test
