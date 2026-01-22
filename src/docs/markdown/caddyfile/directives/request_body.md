---
title: request_body (Caddyfile directive)
---

# request_body

Manipulates or sets restrictions on the bodies of incoming requests.

## Syntax

```caddy-d
request_body [<matcher>] {
	max_size <value>
	set <body_content>
}
```

- **max_size** is the maximum size in bytes allowed for the request body. It accepts all size values supported by [go-humanize](https://pkg.go.dev/github.com/dustin/go-humanize#pkg-constants). Reads of more bytes will return an error with HTTP status `413`.

⚠️ <i>Experimental</i> <span style='white-space: pre;'> | </span> <span>v2.10.0+</span>
- **set** allows setting the request body to specific content. The content can include placeholders to dynamically insert data.

## Examples

Limit request body sizes to 10 megabytes:

```caddy
example.com {
	request_body {
		max_size 10MB
	}
	reverse_proxy localhost:8080
}
```

Set the request body with a JSON structure containing a SQL query:

```caddy
example.com {
	handle /jazz {
		request_body {
			set `\{"statementText":"SELECT name, genre, debut_year FROM artists WHERE genre = 'Jazz'"}`
		}

		reverse_proxy localhost:8080 {
			header_up Content-Type application/json
			method POST
			rewrite * /execute-sql
		}
	}
}
```
