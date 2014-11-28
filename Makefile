
build: components index.js
	@component build --dev

dist: component.json index.js
	@component install
	@component build -s Retsly -o . -n retsly

components: component.json
	@component install --dev

npm: package.json
	@npm install

test: build npm
	@./node_modules/.bin/mochify ./test/test-browserify.js -R spec
	@./node_modules/.bin/mocha-phantomjs test/test.html

clean:
	@rm -fr build components node_modules

.PHONY: clean test

