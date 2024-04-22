---
title: handle_errors (Caddyfile directive)
---

# handle_errors

Sets up error handlers.

When the normal HTTP request handlers return an error, normal processing stops and the error handlers are invoked. Error handlers form a route which is just like normal routes, and they can do anything that normal routes can do. This enables great control and flexibility when handling errors during HTTP requests. For example, you can serve static error pages, templated error pages, or reverse proxy to another backend to handle errors.

The directive may be repeated with different status codes to handle different errors differently. If no status codes are specified, then it will match any error, acting as a fallback if any other error handlers does not match.

A request's context is carried into error routes, so any values set on the request context such as [site root](root) or [vars](vars) will be preserved in error handlers, too. Additionally, [new placeholders](#placeholders) are available when handling errors.

Note that certain directives, for example [`reverse_proxy`](reverse_proxy) which may write a response with an HTTP status which is classified as an error, will _not_ trigger the error routes.

You may use the [`error`](error) directive to explicitly trigger an error based on your own routing decisions.


## Syntax

```caddy-d
handle_errors [<status_codes...>] {
	<directives...>
}
```

- **<status_codes...>** is one or more HTTP status codes to match against the error being handled. The status codes may be 3-digit numbers, or a special case of `4xx` or `5xx` which match against all status codes in the range of 400-499 or 500-599, respectively. If no status codes are specified, then it will match any error, acting as a fallback if any other error handlers does not match.

- **<directives...>** is a list of HTTP handler [directives](/docs/caddyfile/directives) and [matchers](/docs/caddyfile/matchers), one per line.


## Placeholders

The following placeholders are available while handling errors. They are [Caddyfile shorthands](/docs/caddyfile/concepts#placeholders) for the full placeholders which can be found in [the JSON docs for an HTTP server's error routes](/docs/json/apps/http/servers/errors/#routes).

| Placeholder | Description |
|---|---|
| `{err.status_code}` | The recommended HTTP status code |
| `{err.status_text}` | The status text associated with the recommended status code |
| `{err.message}` | The error message |
| `{err.trace}` | The origin of the error |
| `{err.id}` | An identifier for this occurrence of the error |


## Examples

Custom error pages based on the status code (i.e. a page called `404.html` for `404` errors). Note that [`file_server`](file_server) preserves the error's HTTP status code when run in `handle_errors` (assumes you set a [site root](root) in your site beforehand):

```caddy-d
handle_errors {
	rewrite * /{err.status_code}.html
	file_server
}
```

A single error page that uses [`templates`](templates) to write a custom error message:

```caddy-d
handle_errors {
	rewrite * /error.html
	templates
	file_server
}
```

If you want to provide custom error pages only for some error codes, you can check the existence of the custom error files beforehand with a [`file`](/docs/caddyfile/matchers#file) matcher:

```caddy-d
handle_errors {
	@custom_err file /err-{err.status_code}.html /err.html
	handle @custom_err {
		rewrite * {file_match.relative}
		file_server
	}
	respond "{err.status_code} {err.status_text}"
}
```

Reverse proxy to a professional server that is highly qualified for handling HTTP errors and improving your day 😸:

```caddy-d
handle_errors {
	rewrite * /{err.status_code}
	reverse_proxy https://http.cat {
		header_up Host {upstream_hostport}
		replace_status {err.status_code}
	}
}
```

Simply use [`respond`](respond) to return the error code and name

```caddy-d
handle_errors {
	respond "{err.status_code} {err.status_text}"
}
```

To handle specific error codes differently:

```caddy-d
handle_errors 404 410 {
	respond "It's a 404 or 410 error!"
}

handle_errors 5xx {
	respond "It's a 5xx error."
}

handle_errors {
	respond "It's another error"
}
```

The above behaves the same as the below, which uses an [`expression`](/docs/caddyfile/matchers#expression) matcher against the status codes, and using [`handle`](handle) for mutual exclusivity:

```caddy-d
handle_errors {
	@404-410 `{err.status_code} in [404, 410]`
	handle @404-410 {
		respond "It's a 404 or 410 error!"
	}

	@5xx `{err.status_code} >= 500 && {err.status_code} < 600`
	handle @5xx {
		respond "It's a 5xx error."
	}

	handle {
		respond "It's another error"
	}
}
```
