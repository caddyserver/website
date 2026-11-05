---
title: log_level (Caddyfile directive)
---

# log_level

Overrides the level of the access log entry for matched requests, when access logging is enabled with the [`log` directive](log).

By default, access log entries are emitted at the `INFO` level, or `ERROR` if the response has a `5xx` status. This directive replaces that level for matching requests, regardless of the response status. For example, you can lower noisy requests such as health checks to `DEBUG`, or raise requests that deserve attention to `WARN`.

The entry is still subject to the logger's minimum [`level`](log#level) (default `INFO`), so entries lowered to `DEBUG` are dropped unless the logger's level is `DEBUG`. Requests skipped with [`log_skip`](log_skip) are never logged, whatever their level.


## Syntax

```caddy-d
log_level [<matcher>] <level>
```

- **&lt;level&gt;** is the level of the access log entry: one of `DEBUG`, `INFO`, `WARN` or `ERROR` (case-insensitive).

If more than one `log_level` matches a request, the last one wins. Like [`vars`](vars), multiple `log_level` directives are [sorted](/docs/caddyfile/directives#sorting-algorithm) with the least specific path first, so the most specific path matcher wins regardless of the order they're written in.


## Examples

Log health checks at `DEBUG`, so the default `INFO` level drops them:

```caddy
example.com {
	log
	log_level /healthz DEBUG
	reverse_proxy localhost:8080
}
```

Use different levels for different parts of a site; the most specific path wins:

```caddy-d
log_level INFO
log_level /api/* DEBUG
log_level /api/private/* ERROR
```
