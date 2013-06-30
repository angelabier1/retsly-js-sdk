<pre>
                          ,------.        ,--.       ,--.
                          |  .--. ',---.,-'  '-.,---.|  ,--. ,--.
                          |  '--'.| .-. '-.  .-(  .-'|  |\  '  /
                          |  |\  \\   --. |  | .-'  `|  | \   '
                          `--' '--'`----' `--' `----'`--.-'  /
                            Make Real Estate Apps in    `---'
                               Minutes Not Months

</pre>

# retsly-js-sdk

  Retsly JavaScript SDK. Useful for clientside integration with [Retsly](http://rets.ly).

  After you get an API Key you can check out the [API Docs](http://rets.ly/docs).

## Installation

#### Dependencies

  The hosted SDK endpoint includes [jQuery](https://github.com/jquery/jquery),
  [Underscore](https://github.com/documentcloud/underscore/) and [Backbone](https://github.com/documentcloud/backbone)
  on top of our Core SDK.

  This is so that components can be built using [Backbone Views](http://backbonejs.org/#View) which leverage
  a core set of [Models](http://backbonejs.org/#Model) and [Collections](http://backbonejs.org/#Collection)
  which enable proficient use of [Retsly](http://rets.ly) datasets.

  If you aren't a Backbone fan you do not have to use the hosted SDK. You can compile from source and use the
  Core SDK directly to work with the API. The SDK should fall back gracefully if it does not detect Backbone and still
  enable the use of the [Core SDK](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L32) as shown in the
  examples below.

#### Quick Start

  Include the hosted SDK in your HTML header:

  ```html
<script src='http://rets.ly/js/sdk'></script>
  ```

  ...OR if you just want the Core SDK (No Backbone, jQuery or Underscore):

  ```html
<script src='http://rets.ly/javascripts/dist/sdk.js'></script>
  ```

#### Build from source

  Install with [component.io](https://github.com/component/component):

  ```bash
  $ component install Retsly/retsly-js-sdk
  $ component build -o . -n retsly-js-sdk
  ```

  ... then include in your HTML header:

  ```html
<script src='/path/to/retsly-js-sdk.js'></script>
  ```
  > If you build your app using [component.io](http://github.com/component/component) you can simply add
  > `Retsly/retsly-js-sdk` to your `component.json` and build it into your component as a dependency.

## Examples

#### Core SDK

  ```javascript
  var Retsly = require('retsly-js-sdk');
  var retsly = new Retsly('YOURAPIKEY', { debug: true });
  retsly.ready(function(){
    retsly.get('/api/v1/sandicor/listing', { limit: 10 }, function(err, res) {
      if(err) throw err;
      else console.log(res);
    });
  });
  ```

#### Retsly Models

  Retsly models are built on Backbone, so you will need the full SDK with all dependencies to use them.

  - [Retsly.Models.Listing](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L282)
  - [Retsly.Models.Photo](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L317)
  - [Retsly.Models.Agent](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L336)
  - [Retsly.Models.Office](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L352)
  - [Retsly.Models.Geography](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L368)

#### Retsly Collections

  Retsly collections are built on Backbone, so you will need the full SDK with all dependencies to use them.

  - [Retsly.Collections.Listings](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L390)
  - [Retsly.Collections.Photos](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L415)
  - [Retsly.Collections.Agents](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L440)
  - [Retsly.Collections.Offices](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L457)
  - [Retsly.Collections.Geographies](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L474)

#### Retsly Views

  Retsly views are built on Backbone so you will need the full SDK with all dependencies to use them.

  > **Note**: These views maybe be refactored out of the SDK into their own independent components soon.
  > Only very graunular reusable views should exist in the `retsly-js-sdk`.

  - [Retsly.Views.Listing.Detail](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L506)
  - [Retsly.Views.Listing.PhotoTile](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L553)
  - [Retsly.Views.Listing.Search](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L604)
  - [Retsly.Views.Listing.List](https://github.com/Retsly/retsly-js-sdk/blob/master/index.js#L634)


## Building Retsly Components

  Retsly components should be built using [component.io](https://github.com/component/component).
  Components should follow the specific naming context `retsly`-`lang_prefix`-`name`. Add new components to the
  [wiki](https://github.com/Retsly/retsly-js-sdk/wiki/Component-List). This will allow anyone to install
  these components and include them into their source using require:

  ```javascript
    // Example of how a featured listing component might look
    var Featured = require('retsly-js-featured');
    var feature = new Featured('#featured', { mls_id: mls.id, listings: listings, limit: 10 });
    feature.on('click', doSomething);
  ```

  When at all possible abstract specific component behavior into it's own component. If you find your feature
  includes multiple components, try to separate the logic into individual componets, then require them in your
  `component.json` file. This granularity will promote the reuse of generic functionality within the Retsly community.

## License

(The MIT License)

Copyright (c) 2013 Kyle Campbell <mail@slajax.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
