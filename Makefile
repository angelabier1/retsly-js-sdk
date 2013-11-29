
build: components index.js
	@component build --dev

dist: component.json index.js
	@component install
	@component build -s Retsly -o . -n retsly

components: component.json
	@component install --dev

test: build
	@mocha-phantomjs test/test.html

clean:
	@rm -fr build components node_modules

.PHONY: clean test
