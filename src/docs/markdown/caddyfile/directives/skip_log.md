---
title: skip_log (Caddyfile directive)
---

# skip_log

Skips access logging for matched requests.

This should be used alongside the [`log` directive](/docs/caddyfile/directives/log) to skip logging requests that are not relevant for your needs.


## Syntax

```caddy-d
skip_log [<matcher>]
```


## Examples

Skip access logging for static files stored in a subpath:

```caddy-d
skip_log /static*
```


Skip access logging for requests matching a pattern; in this case, for files with particular extensions:

```caddy-d
@skip path_regexp \.(js|css|png|jpe?g|gif|ico|woff|otf|ttf|eot|svg|txt|pdf|docx?|xlsx?)$
skip_log @skip
```


The matcher is not needed if it's found within a route which is already within a matcher. For example with a handle for a file server for a particular subpath:

```caddy-d
handle_path /static* {
	root * /srv/static
	skip_log
	file_server
}
```
