---
title: handle_errors (Caddyfile directive)
---

# handle_errors

Sets up error handlers.

When the normal HTTP request handlers return an error, normal processing stops and the error handlers are invoked. Error handlers form a route which is just like normal routes, and they can do anything that normal routes can do. This enables great control and flexibility when handling errors during HTTP requests.

## Syntax

```caddy-d
handle_errors {
	<directives...>
}
```

- **<directives...>** is a list of HTTP handler directives, directive blocks, or matchers; one per line.
