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

Display in the logs, which reverse proxy upstream was effectively used (either `node1`, `node2` or `node3`) and
the time spent proxying to the upstream in milliseconds as well as how long it took the proxy upstream to write the response header:

```caddy
example.com {
	log

	handle {
		reverse_proxy node1:80 node2:80 node3:80 {
			lb_policy random_choose 2 
		}
		log_append upstream_host {rp.upstream.host}
		log_append upstream_duration_ms {rp.upstream.duration_ms}
		log_append upstream_latency_ms {rp.upstream.latency_ms}
	}
}
```
