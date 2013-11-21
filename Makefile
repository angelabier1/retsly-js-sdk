
build: components index.js node_modules
	@component build --dev
	@cat node_modules/socket.io-client/dist/socket.io.js >> build/build.js

dist: component.json index.js node_modules
	@component install
	@component build -s Retsly -o . -n retsly
	@cat node_modules/socket.io-client/dist/socket.io.js >> retsly.js

components: component.json
	@component install --dev

node_modules: package.json
	@npm install --production

test: build
	@echo open http://localhost:3000/test/test.html
	@serve -p 3000

clean:
	@rm -fr build components node_modules

.PHONY: clean test
