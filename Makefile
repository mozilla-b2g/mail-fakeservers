.PHONY: test
test: node_modules
	./node_modules/.bin/mocha --ui tdd --recursive

node_modules:
	npm install

