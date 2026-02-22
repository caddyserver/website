---
title: log_append (Caddyfile directive)
---

# log_append

Appends a field to the access log for the current request.

This should be used alongside the [`log` directive](log) which is required to enable access logging in the first place.

The value may be a static string, or a [placeholder](/docs/caddyfile/concepts#placeholders) which will be replaced with the value of the placeholder at the time of the request.


## Syntax

```caddy-d
log_append [<matcher>] [<]<key> <value>
```

By default, the log field is added on the way back up the middleware chain (i.e. "late"), after all subsequent handlers have completed (e.g. after handlers like [`reverse_proxy`](reverse_proxy), [`respond`](respond), or [`file_server`](file_server), which write a response), so it captures the final state of the request and response.

If `<` is used as a prefix to the key, it is marked as "early", which means the log field will be added to the logs _before_ calling the next handler in the chain, so the request can be read before it is modified by subsequent handlers.

For debugging purposes only (not for use in production), the handler has specialized handling when the value is one of these placeholders: `{http.request.body}`, `{http.request.body_base64}`, `{http.response.body}`, or `{http.response.body_base64}`. If a request body placeholder is used, then "early" mode is implicitly enabled, and the request body will be buffered. If a response body placeholder is used, response buffering is enabled to capture the response body and the field is added to the log "late", as the response is being written.


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

A field can be added to the logs "early" by prefixing the key with `<`. This allows you to capture the state of the request before it is modified by subsequent handlers. For example, to log the original request path before it gets rewritten (though this is a contrived example, since the original request path is already logged anyway, but just helps illustrate the point):

```caddy
example.com {
	log
	log_append <original_path {http.request.uri.path}
	rewrite * /new-base{uri}
	reverse_proxy localhost:9000
}
```

For debugging purposes, add the request and response bodies to the logs (not for use in production, as this harms performance and makes the logs very noisy). If you expect the bodies to be binary data with non-printable characters, you can use the base64 variants of the placeholders instead (e.g. `{http.request.body_base64}` and `{http.response.body_base64}`), which will be easier to copy and inspect:

```caddy
example.com {
	log
	log_append req_body {http.request.body}
	log_append resp_body {http.response.body}

	reverse_proxy localhost:9000
}
```
