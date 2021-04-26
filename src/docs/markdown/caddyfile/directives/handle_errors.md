---
title: handle_errors (Caddyfile directive)
---

# handle_errors

Sets up error handlers.

When the normal HTTP request handlers return an error, normal processing stops and the error handlers are invoked. Error handlers form a route which is just like normal routes, and they can do anything that normal routes can do. This enables great control and flexibility when handling errors during HTTP requests. For example, you can serve static error pages, templated error pages, or reverse proxy to another backend to handle errors.

A request's context is carried into error routes, so any values set on the request context such as [site root](root) will be preserved in error handlers, too. Additionally, new placeholders are available when handling errors. [The JSON docs for an HTTP server's error routes](/docs/json/apps/http/servers/errors/#routes) describe these placeholders. The `handle_errors` directive simply adds error routes, so you can use those placeholders within a `handle_errors` block.

Note that certain directives, for example [`reverse_proxy`](reverse_proxy) which may write a response with an HTTP status which is classified as an error, will _not_ trigger the error routes.

You may use the [`error`](error) directive to explicitly trigger an error based on your own routing decisions.


## Syntax

```caddy-d
handle_errors {
	<directives...>
}
```

- **<directives...>** is a list of HTTP handler directives, directive blocks, or matchers; one per line.



## Examples

Custom error pages based on the status code (i.e. a page called `404.html` for 404 errors). Note that [`file_server`](file_server) preserves the error's HTTP status code when run in `handle_errors`:

```caddy-d
handle_errors {
	rewrite * /{http.error.status_code}.html
	file_server
}
```

A single error page that uses [`templates`](/docs/caddyfile/directives/templates) to write a custom error message:

```caddy-d
handle_errors {
	rewrite * /error.html
	templates
	file_server
}
```

Reverse proxy to a professional server that is highly qualified for handling HTTP errors and improving your day 😸:

```caddy-d
handle_errors {
	rewrite * /{http.error.status_code}
	reverse_proxy https://http.cat {
		header_up Host http.cat
	}
}
```

Simply use [`respond`](/docs/caddyfile/directives/respond) to return the error code and name

```caddy-d
handle_errors {
	respond "{http.error.status_code} {http.error.status_text}"
}
```

To handle specific error codes differently, use an [`expression`](/docs/caddyfile/matchers#expression) matcher:

```caddy-d
handle_errors {
	@4xx expression `{http.error.status_code} >= 400 && {http.error.status_code} < 500`
	respond @4xx "It's a 4xx error!"

	respond "It's not a 4xx error."
}
```
