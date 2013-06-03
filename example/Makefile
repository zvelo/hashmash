COFFEE = ../node_modules/.bin/coffee

objects = example.js

all: example

example.js: ../src/example.coffee
	$(COFFEE) -co . ../src/example.coffee

example: example.js

clean:
	-$(RM) $(objects)

.PHONY: all example clean
