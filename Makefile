
build: components index.js node_modules
	@component build --dev
	@cat node_modules/socket.io-client/dist/socket.io.js >> build/build.js

standalone: components index.js node_modules
	@component build -s Retsly -o dist -n retsly-js-sdk
	@cat node_modules/socket.io-client/dist/socket.io.js >> dist/retsly-js-sdk.js

components: component.json
	@component install --dev

node_modules: package.json
	@npm install --production

test: build
	@serve -p 3000

clean:
	rm -fr build components node_modules

.PHONY: clean test
