---
title: basic_auth (Caddyfile directive)
---

# basic_auth

Enables HTTP Basic Authentication, which can be used to protect directories and files with a username and hashed password.

**Note that basic auth is not secure over plain HTTP.** Use discretion when deciding what to protect with HTTP Basic Authentication.

When a user requests a resource that is protected, the browser will prompt the user for a username and password if they have not already supplied one. If the proper credentials are present in the Authorization header, the server will grant access to the resource. If the header is missing or the credentials are incorrect, the server will respond with HTTP 401 Unauthorized.

Caddy configuration does not accept plaintext passwords; you MUST hash them before putting them into the configuration. The [`caddy hash-password`](/docs/command-line#caddy-hash-password) command can help with this.

After a successful authentication, the `{http.auth.user.id}` placeholder will be available, which contains the authenticated username.

Prior to v2.8.0, this directive was named `basicauth`, but was renamed for consistency with other directives.


## Syntax

```caddy-d
basic_auth [<matcher>] [<hash_algorithm> [<realm>]] {
	<username> <hashed_password>
	...
}
```

- **&lt;hash_algorithm&gt;** is the name of the password hashing algorithm (or KDF) used for the hashes in this configuration. Default: `bcrypt`

- **&lt;realm&gt;** is a custom realm name.

- **&lt;username&gt;** is a username or user ID.

- **&lt;hashed_password&gt;** is the password hash.


## Examples

Require authentication for all requests to `example.com`:

```caddy
example.com {
	basic_auth {
		# Username "Bob", password "hiccup"
		Bob $2a$14$Zkx19XLiW6VYouLHR5NmfOFU0z2GTNmpkT/5qqR7hx4IjWJPDhjvG
	}
	respond "Welcome, {http.auth.user.id}" 200
}
```

Protect files in `/secret/` so only `Bob` can access them (and anyone can see other paths):

```caddy
example.com {
	root * /srv

	basic_auth /secret/* {
		# Username "Bob", password "hiccup"
		Bob $2a$14$Zkx19XLiW6VYouLHR5NmfOFU0z2GTNmpkT/5qqR7hx4IjWJPDhjvG
	}

	file_server
}
```

