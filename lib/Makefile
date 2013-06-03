COFFEE = ../node_modules/.bin/coffee

objects = sha1.js hashcash.js worker.js

all: lib

sha1.js: ../src/sha1.coffee
	$(COFFEE) -co . ../src/sha1.coffee

hashcash.js: sha1.js ../src/hashcash.coffee
	$(COFFEE) -co . ../src/hashcash.coffee

worker.js: hashcash.js ../src/worker.coffee
	$(COFFEE) -co . ../src/worker.coffee

lib: hashcash.js worker.js

clean:
	@echo "cleaning lib"
	-$(RM) $(objects)

.PHONY: all lib clean
