---
title: log_skip (Caddyfile directive)
---

# log_skip

Skips access logging for matched requests.

This should be used alongside the [`log` directive](log) to skip logging requests that are not relevant for your needs.

Prior to v2.8.0, this directive was named `skip_log`, but was renamed for consistency with other directives.


## Syntax

```caddy-d
log_skip [<matcher>]
```


## Examples

Skip access logging for static files stored in a subpath:

```caddy
example.com {
	root * /srv

	log
	log_skip /static*

	file_server
}
```


Skip access logging for requests matching a pattern; in this case, for files with particular extensions:

```caddy-d
@skip path_regexp \.(js|css|png|jpe?g|gif|ico|woff|otf|ttf|eot|svg|txt|pdf|docx?|xlsx?)$
log_skip @skip
```


The matcher is not needed if it's found within a route which is already within a matcher. For example with a handle for a file server for a particular subpath:

```caddy-d
handle_path /static* {
	root * /srv/static
	log_skip
	file_server
}
```
