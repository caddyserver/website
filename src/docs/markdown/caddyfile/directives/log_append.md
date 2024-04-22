---
title: log_append (Caddyfile directive)
---

# log_append

Appends a field to the access log for the current request.

This should be used alongside the [`log` directive](log) which is required to enable access logging in the first place.

The value may be a static string, or a [placeholder](/docs/caddyfile/concepts#placeholders) which will be replaced with the value of the placeholder at the time of the request.


## Syntax

```caddy-d
log_append [<matcher>] <key> <value>
```


## Examples

Display in the logs the area of the site that the request is being served from, either `static` or `dynamic`:

```caddy
example.com {
	log

	handle /static* {
		log_append area "static"
		respond "Static response!"
	}

	handle {
		log_append area "dynamic"
		reverse_proxy localhost:9000
	}
}
```
