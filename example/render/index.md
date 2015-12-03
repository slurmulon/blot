FORMAT: 1A
HOST: |* blot.config.host|

# Hazy Responses API
Some description

# Users
Create users with random information

## New User [/user]

+ Request Create User (application/json)

    + Body

        { "username": "|~ web.email|", "password": "|~ basic.string|" }

+ Response 200 (application/json)

    |> console.log('logging directly from hazy.md :)')|

    + Body

        { "message": "success" }
