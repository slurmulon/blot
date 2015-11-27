# blot

> The Ultra-DRY documentation build tool

## tl;dr

API Blueprint + Transclusion + Queries = Ultra-DRY Docs

* Build tool for normalized API Blueprints
* Unifies documentation and fixtures via transclusion and queries
* Eases the maintenance of documentation, fixtures and tests

## Features

* Dynamically build API Blueprints from normalized files (.md, .mson, .json, etc)
* Generate random data anywhere using a non-invasive syntax
* Reference, query and embed data using the same non-invasive syntax
* Extract and export JSON fixtures from API Blueprints
* Export API Blueprints as HTML (web-component friendly, choose what you want)
* Multi-environment project configurations
* Flexible CLI with verbose logging

## Summary

[API Blueprint](https://github.com/apiaryio/api-blueprint) is an open-source specification for programmatically
documenting your APIs in pure Markdown. The specification is highly flexible and is focused on human readability.
API Blueprints also machine readable, they naturally support tooling. They can be used to generate mock servers,
automate integration testing, allow exportation of requests to tools such as Postman or cURL, and _much much_ more.

A limitation of API blueprints is that they are static, and there are few (if any) plugins for parsing
documented requests and responses for programmatic (in-code) use in your integration and unit tests.
My philosophy is that you should strive for a canonical source of fixtures in which all of your tests and documentation inherit from.
[Hercule](https://github.com/jamesramsay/hercule), which blot also integrates, helps promote normalization by allowing
data to be transcluded in markdown documents. blot also supports this through hazy, and either syntax may be used as they will
both be processed. The reason that hazy is also used is because it provides additional interfaces for generating random data and querying JSON fixtures.

blot minimizes duplication and introduces unification between documentation, fixtures, and API test suites. It sits
on top of Hazy and provides an abstract API blueprint parser and generator.

## Hazy

[Hazy](https://github.com/slurmulon/hazy) is a simple specification (with an accompanying node library) for lazily
processing dynamic test fixtures. It provides a simple syntax for interpolating random data and pattern-matched data into your fixtures.
It alleviates the need for developers to constantly come up with names, addresses, etc. for their enormous amount of test data.

The most powerful feature of hazy is that it allows developers to dynamically embed fixtures (or sub-fixtures) via `JsonPath` patterns or by a simple string.
This is very useful when creating and maintaining fixtures that share identical or related pieces of data, especially as an application grows.

In blot, hazy acts as a standardized bridge between your documentation and tests. It pushes your fixtures out of your code and
into a datastore such as your file system or a database, inherently canonical sources of data. Your API Blueprints and tests can
then be dynamically generated by processing the fixtures via the blot API.

## Examples

The following is an API blueprint decorated with some basic hazy tokens.
The `~` keyword tells hazy to replace the token with categorized random data:

```
### Login a user [POST]

# POST /v1/auth
+ Request (application/json)

  { "username": "|~web:email|", "password": "|~text:word|" }

+ Response 200 (application/json)

  { "token": "|~misc:guid|", "refresh_token": "|~misc:guid|", "expires": "|~time:date|" }

# GET /v1/user/{id}
### Fetch a user [GET]

+ Response authentication (application/json)

  { "username": "|~web:email|", "first": "|~person:first|", "last": "|~person:last|", "address": "|~geo:address|" }
```

Alternatively, you can be even more lazy, which is encouraged for increased normalization. The following example
shows how you can reference and embed large fixtures that live on the filesystem using the `>` operator. It can
be used alongside hercule by using `:[]`:

```
# POST /v1/auth
### Login a user [POST]

+ Request (application/json)

  |> auth-req.json|

+ Response 200 (application/json)

  :[](auth-user-res.json)

# GET /v1/user/{id}
### Fetch a user [GET]

+ Response 200 (application/json)

  :[](auth-user-res.json)
```

You may also freely leverage `JsonPath` in order to transclude fixtures by patterns:

```
# POST /v1/auth
### Login a user [POST]

+ Request (application/json)

  :[](auth-req.json)

+ Response 200 (application/json)

  |* $..user[0]|

# GET /v1/user/{id}
### Fetch a user [GET]

+ Response 200 (application/json)

  |* $..user[0]|
```

Subsets of fixtures may also be targeted.
The following `GET` user fixture is friends with four arbitrary users:

```
# POST /v1/auth
### Login a user [POST]

+ Request (application/json)

  |> auth-req.json|

+ Response 200 (application/json)

  {"user": "|* $..user[0]|", "friends": []}

# GET /v1/user/{id}
### Fetch a user [GET]

+ Response 200 (application/json)

  {"user": "|* $..user[0]|", "friends": "|* $..user.id[:4]|"}
```

### Command Line

The easiest way to use blot is by running it as a command.

You can specify an API blueprint file to parse and export:

**Standard**
```bash
$ blot compile -i docs.blot.apib --echo > docs.apib
```

**Fancy**
```bash
$ blot compile -i docs.blot.apib -o docs.apib --pretty
```

You may also pass in the raw data:

```bash
$ blot compile -d 'FORMAT: 1A
# The Simplest API

# GET /message
+ Response 200 (text/json)

{"message": "Hello, |~person:name|!", "id": "|~misc:guid|"}' -o docs.apib --pretty
```

#### Help?

```
blot compile --help
```
(thorough documentation coming soon!)

### Node

The node module allows you to monkey-patch special functionality and data to your fixtures.
You can then inject your monkey-patched hazy pool by setting `blot.interpolator`, which is
used whenever API blueprints are processed.

The following example attaches a `created` property to all fixtures. It also appends a 
`fixture` query parameter to any fixture with a `url` property (deep):

```javascript
#! /usr/bin/env node

import gulp from 'gulp'
import hazy from 'hazy'
import blot from 'blot'
import moment from 'moment'

// ensure all fixtures have a created date
hazy.matcher.config({
  path   : '$',
  handle : (fixture) => {
    return Object.assign({created: moment()}, fixture)
  }
})

// ensure any fixture urls are appended with a '&fixture' query param
hazy.matcher.config({
  path   : '$..url',
  handle : (url) => `${url}&fixture=true`
})

// globs and loads fixtures from filesystem into hazy's pool
hazy.fixture.load('**/fixtures/*.json', null, (key) => key.replace('.json'))

// use the newly configured hazy object (and, by association, its fixture pool) when parsing API blueprints
blot.interpolator = hazy.lang.process

// load api blueprint, process fixtures against configured hazy pool, then export as a static API blueprint file
blot.io
  .src('documentation.blot.apib')
  .then(compiled => blot.dist(compiled.content, 'dist/documentation.apib'))
  .then(result   => blot.log('done exporting!'))
```

## Install

```
$ git clone git@github.com:slurmulon/blot.git
$ cd blot
$ npm link
```

You can now use blot as either an npm module in your own projects or as an executable command.

## TODO

 - [X] `--env` CLI flag
 - [ ] Support [fury.js](https://github.com/apiaryio/fury.js)
 - [ ] Static fixture export
 - [ ] Support `beforeCompile` and `afterCompile` configuration files (root of project)
