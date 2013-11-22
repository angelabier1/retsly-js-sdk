
build: components index.js
	@component build --dev

dist: component.json index.js
	@component install
	@component build -s Retsly -o . -n retsly

components: component.json
	@component install --dev

test: build
	@echo open http://localhost:3000/test/test.html
	@serve -p 3000

clean:
	@rm -fr build components node_modules

.PHONY: clean test
