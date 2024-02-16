---
title: error (Caddyfile directive)
---

# error

Triggers an error in the HTTP handler chain, with an optional message and recommended HTTP status code. 

This handler does not write a response. Instead, it's meant to be paired with the [`handle_errors`](handle_errors) directive to invoke your custom error handling logic.


## Syntax

```caddy-d
error [<matcher>] <status>|<message> [<status>] {
    message <text>
}
```

- **&lt;status&gt;** is the HTTP status code to write. Default is `500`.
- **&lt;message&gt;** is the error message. Default is no error message.
- **message** is an alternate way to provide an error message; convenient if it is multiple lines.

To clarify, the first non-matcher argument can be either a 3-digit status code, or an error message string. If it is an error message, the next argument can be the status code.


## Examples

Trigger an error on certain request paths, and use [`handle_errors`](handle_errors) to write a response:

```caddy
example.com {
	root * /srv

	# Trigger errors for certain paths
    error /private* "Unauthorized" 403
	error /hidden* "Not found" 404

    # Handle the error by serving an HTML page 
    handle_errors {
        rewrite * /{err.status_code}.html
		file_server
    }

	file_server
}
```
