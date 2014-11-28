
build: components index.js
	@./node_modules/.bin/component build --dev

dist: component.json index.js
	@./node_modules/.bin/component install
	@./node_modules/.bin/component build -s Retsly -o . -n retsly

components: component.json
	@./node_modules/.bin/component install --dev

npm: package.json
	@npm install

test: npm build
	@./node_modules/.bin/mochify ./test/test-browserify.js -R spec
	@./node_modules/.bin/mocha-phantomjs test/test.html

clean:
	@rm -fr build components node_modules

.PHONY: clean test

