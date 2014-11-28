# retsly-js-sdk [![wercker status](https://app.wercker.com/status/0fdacfc21927ee822804af8c7887568d/s/ "wercker status")](https://app.wercker.com/project/bykey/0fdacfc21927ee822804af8c7887568d)
Retsly core SDK. Useful for clientside integration with [Retsly](http://rets.ly).

This component provides low-level access to the socket API. For a higher-level
component, use [retsly/retsly-js-backbone](https://github.com/retsly/retsly-js-backbone).

> After you get an API Key you can check out the [API Docs](http://rets.ly/docs).

## Installation

#### Quick Start

Include the hosted SDK in your HTML header:

```html
<script src='https://rets.ly/js/sdk'></script>
```
#### Use with browserify

Install with [npm](http://github.com/Retsly/retsly-js-sdk):

```bash
$ npm install retsly-js-sdk
```

#### Use with component

Install with [component](https://github.com/component/component):

```bash
$ component install retsly/retsly-js-sdk
```

Use with `require`:

```js
var Retsly = require('retsly-js-sdk')
```

#### Build from source

Clone the repo and build the standalone file `retsly.js`:

```bash
$ git clone https://github.com/Retsly/retsly-js-sdk
$ cd retsly-js-sdk
$ make dist
```

Include in your project:

```html
<script src='/path/to/retsly.js'></script>
```

This will export the client SDK as an AMD or CommonJS module,
or `window.Retsly`.

#### Use with Phonegap

You'll need to add **rets.ly** and **rets.io** to your application's whitelist.
See the [Whitelist Guide](http://docs.phonegap.com/en/3.1.0/guide_appdev_whitelist_index.md.html)
for instructions.


## Example

```js
var retsly = require('retsly-js-sdk');
var retsly = new Retsly(YOUR_CLIENT_ID, YOUR_JS_TOKEN);
retsly.ready(function(){
  retsly.get('/api/v1/listing/sandicor.json', {limit: 10}, function(res){
    if (!res.success) throw new Error(res.bundle);
    console.log(res);
  });
});
```

## Building Retsly Components

Retsly components should be built using
[component](https://github.com/component/component). Components should
follow the naming convention `retsly`-`lang_prefix`-`name`. Add new
components to the [wiki](https://github.com/Retsly/retsly-js-sdk/wiki/Component-List).
This will allow anyone to install these components and include them into
their source using require:

```js
// Example of how a featured listing component might look
var Featured = require('retsly-js-featured');
var feature = new Featured('#featured', { vendorID: mls.id, listings: listings, limit: 10 });
feature.on('click', doSomething);
```

When at all possible abstract specific component behavior into it's own
component. If you find your feature includes multiple components, try to
separate the logic into individual componets, then require them in your
`component.json` file. This granularity will promote the reuse of generic
functionality within the Retsly community.

## Repo Owner

[Jason Wan](http://github.com/jkhwan)

## License

(The MIT License)

Copyright (c) 2014 Retsly Software Inc <support@rets.ly>

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the 'Software'),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
