---
title: respond (Caddyfile directive)
---

# respond

Writes a hard-coded/static response to the client.

If the body is non-empty, this directive sets the `Content-Type` header if it is not already set. The default value is `text/plain; utf-8` unless the body is a valid JSON object or array, in which case it is set to `application/json`. For all other types of content, set the proper Content-Type explicitly using the [`header` directive](/docs/caddyfile/directives/header).


## Syntax

```caddy-d
respond [<matcher>] <status>|<body> [<status>] {
	body <text>
	close
}
```

- **&lt;status&gt;** is the HTTP status code to write.

  If `103` (Early Hints), the response will be written without a body and the handler chain will continue. (HTTP `1xx` responses are informational, not final.)
  
  Default: `200`

- **&lt;body&gt;** is the response body to write.

- **body** is an alternate way to provide a body; convenient if it is multiple lines.

- **close** will close the client's connection to the server after writing the response.

To clarify, the first non-matcher argument can be either a 3-digit status code or a response body string. If it is a body, the next argument can be the status code.

<aside class="tip">

Responding with an error status code is different than returning an error in the handler chain, which invokes error handlers internally.

</aside>


## Examples

Write an empty 200 status with an empty body to all health checks, and a simple response body to all other requests:

```caddy
example.com {
	respond /health-check 200
	respond "Hello, world!"
}
```

Write an error response and close the connection:

<aside class="tip">

You might prefer to use the [`error` directive](error) instead, which triggers an error that can be handled with the [`handle_errors` directive](handle_errors).

</aside>

```caddy
example.com {
	respond /secret/* "Access denied" 403 {
		close
	}
}
```

Write an HTML response, using [heredoc syntax](/docs/caddyfile/concepts#heredocs) to control whitespace, and also setting the `Content-Type` header to match the response body:

```caddy
example.com {
	header Content-Type text/html
	respond <<HTML
		<html>
			<head><title>Foo</title></head>
			<body>Foo</body>
		</html>
		HTML 200
}
```
