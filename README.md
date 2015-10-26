# HazyDocs

> Lazily generate dynamic API Blueprints with programmatic fixtures

## tl;dr

* API Blueprint + Hazy = Magic Fixtures
* Reference and embed documentation / test fixtures by patterns or name (DRY)
* Establishes canonical source of documentation and test data
* Increases fixture and test readability

## Summary

[API Blueprint](https://github.com/apiaryio/api-blueprint) is an open-source specification for programmatically
documenting your APIs in pure Markdown. The specification is highly flexible and is focused on human readability.
One notable benefit is that your documentation can be used to drive integration and end-to-end tests, potentially
eliminating the need for entire collections of test suites. This is achieved along with the tool Dredd.

API blueprint also allows for mock servers to be generated entirely from your documentation,
enabling front-end and back-end developers to independently complete tasks regardless of their
own progress by agreeing to pre-established formats.

A limitation of API blueprints is that they are static, and there are few (if any) plugins for parsing
documented requests and responses for direct use in your integration, end-to-end, or even unit tests. My philosophy is
that you should strive for a canonical source of fixtures in which all of your tests and documentation inherit from.
[Hercule](https://github.com/jamesramsay/hercule), which HazyDocs also integrates, improves this drastically by allowing
Markdown documents to be transcluded. However, this does not address the issue of having decentralized fixtures with
repeated content.

HazyDocs minimizes duplication and introduces unification between documentation, fixtures, and API test suites. It sits
on top of Hazy and provides an abstract API blueprint parser and generator.

## Hazy

[Hazy](https://github.com/slurmulon/hazy) is a simple specification (with an accompanying node library) for lazily
generating dynamic test fixtures. It provides a unique syntax for interpolating random data in your fixtures.
It alleviates the need for developers to constantly come up with names, addresses, etc. for their enormous amount of test data.

The most powerful feature of Hazy is that it allows developers to dynamically embed fixtures via `JsonPath` patterns or by a simple string.
This is very useful when creating and maintaining fixtures that share identical or related pieces of data, especially as applications grow.

In HazyDocs, Hazy acts as a specification bridge between your documentation and tests. It pushes your fixtures out of your code and
onto your file system, an inherently canonical source of data. Your API blueprints (documentaiton) and tests can then be dynamically generated
by consuming the processed (or even unprocessed, lazy) fixtures via the HazyDocs API.

## Example

```
### Login a user [POST]

+ Request (application/json)

    { "username": "|~text:word|", "password": "|~text:word|" }

+ Response 200 (application/json)

	{ "token": "|~misc:guid|", "refresh_token": "|~misc:guid|", "expires": "|~time:date|" }

### Fetch a user [GET]

+ Request (application/json)

	{ "token": "|~misc:guid|", "refresh_token": "|~misc:guid|" }

+ Response authentication (application/json)

	{ "username": "|~text:word|", "first": "|~person:first|", "last": "|~person:last|", "address": "|~geo:address|" }
```

alternatively, you can be more lazy which is encouraged for centralization:

```
### Login a user [POST]

+ Request (application/json)

	|@ auth-request|

+ Response 200 (application/json)

	|@ auth-response|

### Fetch a user [GET]

+ Request (application/json)

	|@ authed-user-request|

+ Response 200 (application/json)

	|@ authed-user-response|
```
