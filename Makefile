
build: components index.js styles/style.css
	@component build --dev

standalone: components index.js styles/style.css
	@component build -s Retsly -o dist -n retsly-js-sdk

components: component.json
	@component install --dev

clean:
	rm -fr build components

.PHONY: clean
