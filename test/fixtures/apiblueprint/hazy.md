FORMAT: 1A

# Hazy Responses API
Some description

## API Blueprint
+ [Previous: Grouping Resources](04.%20Grouping%20Resources.md)
+ [This: Raw API Blueprint](https://raw.github.com/apiaryio/api-blueprint/master/examples/05.%20Responses.md)
+ [Next: Requests](06.%20Requests.md)

# Users
Create users with random information

## New User [/user]

### Create a User [POST]
This action has **two** responses defined: One returing a plain text and the other a JSON representation of our resource. Both has the same HTTP status code. Also both responses bear additional information in the form of a custom HTTP header. Note that both responses have set the `Content-Type` HTTP header just by specifying `(text/plain)` or `(application/json)` in their respective signatures.

+ Request Create User (application/json)

    + Body

            { "username": "|~basic:string|_|~basic:integer|", "password": "|~basic:string|" }

+ Response 200 (application/json)

    + Body

            { "message": "Welcome, |~person:name|" }