FORMAT: 1A
HOST: |* blot.config.host|

# Hazy Responses API
Some description

# Users
Create users with random information

## New User [/user]

+ Request Create User (application/json)

    + Body

        :[](user.json)

+ Response 200 (application/json)

    |> console.log('logging directly from hazy.md :)')|

    + Body

        { "message": "success" }
