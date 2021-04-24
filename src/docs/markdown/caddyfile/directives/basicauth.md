---
title: basicauth (Caddyfile directive)
---

# basicauth

Enables HTTP Basic Authentication, which can be used to protect directories and files with a username and hashed password.

**Note that basic auth is not secure over plain HTTP.** Use discretion when deciding what to protect with HTTP Basic Authentication.

When a user requests a resource that is protected, the browser will prompt the user for a username and password if they have not already supplied one. If the proper credentials are present in the Authorization header, the server will grant access to the resource. If the header is missing or the credentials are incorrect, the server will respond with HTTP 401 Unauthorized.

Caddy configuration does not accept plaintext passwords; you MUST hash them before putting them into the configuration. The [`caddy hash-password`](/docs/command-line#caddy-hash-password) command can help with this.

After a successful authentication, the `{http.auth.user.id}` placeholder will be available, which contains the authenticated username.


## Syntax

```caddy-d
basicauth [<matcher>] [<hash_algorithm> [<realm>]] {
	<username> <hashed_password_base64> [<salt_base64>]
	...
}
```

- **&lt;hash_algorithm&gt;** is the name of the password hashing algorithm (or KDF) used for the hashes in this configuration. Can be `bcrypt` (default) or `scrypt`.
- **&lt;realm&gt;** is a custom realm name.
- **&lt;username&gt;** is a username or user ID.
- **&lt;hashed_password_base64&gt;** is the base-64 encoding of the hashed password.
- **&lt;salt_base64&gt;** is the base-64 encoding of the password salt, if an external salt is required.


## Examples

Protect all resources in /secret so only Bob can access them with the password "hiccup":

```caddy-d
basicauth /secret/* {
	Bob JDJhJDEwJEVCNmdaNEg2Ti5iejRMYkF3MFZhZ3VtV3E1SzBWZEZ5Q3VWc0tzOEJwZE9TaFlZdEVkZDhX
}
```

If you're also using [`handle_errors`](handle_errors) (for example to change how a `502` error from [`reverse_proxy`](reverse_proxy) is displayed), then make sure to use [`respond`](respond) to write the HTTP status, since the HTTP status is not written automatically when using error handlers.

```caddy-d
handle_errors {
	# The reverse_proxy handler had no upstream to proxy to,
	# and we want to display a custom 502 page in that case
	@out-of-order expression `{http.error.status_code} == 502`
	handle @out-of-order {
		rewrite * /502.html
		file_server
	}

	# Write the HTTP status code from basicauth (i.e. 401)
	respond {http.error.status_code}
}
```
