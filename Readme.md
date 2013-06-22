
# retsly-js-sdk

  Retsly JavaScript SDK. Allows developers to integreate with [Retsly](http://rets.ly) MLS Data.

  After you get an API Key you can check out the [API Docs](http://rets.ly/docs).

## Installation

#### Dependencies

  The hosted SDK endpoint includes jQuery, Underscore and Backbone on top of our Core SDK. This is so that components 
  can be implemented as Backbone Views. We chose this because Backbone is very good with handling large datasets. 
  You don't however have to use these if you don't want to. If you compile from source, you can use the Core API directly 
  to work with the API. The SDK should fail gracefully if it does not detect Backbone, jQuery or Underscore.

#### Quick Start

  ```html
<script src='http://rets.ly/js/sdk'></script>
  ```

`OR if you just want the core SDK`

  ```html
<script src='http://rets.ly/javascripts/dist/sdk.js'></script>
  ```

#### Build from source

  Install with [component.io](https://github.com/component/component):

  ```bash
  $ component install Retsly/retsly-js-sdk
  $ component build -o . -n retsly-js-sdk
  ```

  ... then include in your html header:

  ```html
<script src='/path/to/retsly-js-sdk.js'></script>
  ```

## Examples

#### Core API

  ```javascript
  var Retsly = require('retsly-js-sdk');
  var retsly = new Retsly('YOURAPIKEY', { debug: true });
  retsly.get('/api/v1/sandicor/listing', { limit: 10 }, function(err, res) {
    if(err) throw err;
    else console.log(res);
  })
  ```

#### Backbone Models
  - Listing
  - Agent
  - Office
  - Geography
  - Photo

## License

(The MIT License)

Copyright (c) 2013 Kyle Campbell <mail@slajax.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
