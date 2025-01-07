---
title: import (Caddyfile directive)
---

# import

Includes a [snippet](/docs/caddyfile/concepts#snippets) or file, replacing this directive with the contents of the snippet or file.

This directive is a special case: it is evaluated before the structure is parsed, and it can appear anywhere in the Caddyfile.

## Syntax

```caddy-d
import <pattern> [<args...>] [{block}]
```

- **&lt;pattern&gt;** is the filename, glob pattern, or name of [snippet](/docs/caddyfile/concepts#snippets) to include. Its contents will replace this line as if that file's contents appeared here to begin with.

  It is an error if a specific file cannot be found, but an empty glob pattern is not an error.

  If importing a specific file, a warning will be emitted if the file is empty.

  If the pattern is a filename or glob, it is always relative to the file the `import` appears in.

  If using a glob pattern `*` as the final path segment, hidden files (i.e. files starting with a `.`) are ignored. To import hidden files, use `.*` as the final segment.
- **&lt;args...&gt;** is an optional list of arguments to pass to the imported tokens. This placeholder is a special case and is evaluated at Caddyfile-parse-time, not at run-time. They can be used in various forms, similarly to [Go's slice syntax](https://gobyexample.com/slices):
  - `{args[n]}` where `n` is the 0-based positional index of the parameter
  - `{args[:]}` where all the arguments are inserted
  - `{args[:m]}` where the arguments before `m` are inserted
  - `{args[n:]}` where the arguments beginning with `n` are inserted
  - `{args[n:m]}` where the arguments in the range between `n` and `m` are inserted

  For the forms that insert many tokens, the placeholder **must** be a [token](/docs/caddyfile/concepts#tokens-and-quotes) on its own, it cannot be part of another token. In other words, it must have spaces around it, and cannot be in quotes.

  Note that prior to v2.7.0, the syntax was `{args.N}` but this form was deprecated in favor of the more flexible syntax above.

⚠️ <i>Experimental</i> <span style='white-space: pre;'> | </span> <span>v2.9.x+</span>
- **{block}** is an optional block to pass to the imported tokens. This placeholder is a special case, and is evaluated recursively at Caddyfile-parse-time, not at runtime. They can be used in two forms:
  - `{block}` where the content of the whole provided block will be substituted for the placeholder
  - `{blocks.key}` where `key` is the first token of a parameter within the provided block


## Examples

Import all files in an adjacent sites-enabled folder (except hidden files):

```caddy-d
import sites-enabled/*
```

Import a snippet that sets CORS headers using an import argument:

```caddy
(cors) {
	@origin header Origin {args[0]}
	header @origin Access-Control-Allow-Origin "{args[0]}"
	header @origin Access-Control-Allow-Methods "OPTIONS,HEAD,GET,POST,PUT,PATCH,DELETE"
}

example.com {
	import cors example.com
}
```

Import a snippet which takes a list of proxy upstreams as arguments:

```caddy
(https-proxy) {
	reverse_proxy {args[:]} {
		transport http {
			tls
		}
	}
}

example.com {
	import https-proxy 10.0.0.1 10.0.0.2 10.0.0.3
}
```

Import a snippet which creates a proxy with a prefix rewrite rule as the first argument:

```caddy
(proxy-rewrite) {
	rewrite * {args[0]}{uri}
	reverse_proxy {args[1:]}
}

example.com {
	import proxy-rewrite /api 10.0.0.1 10.0.0.2 10.0.0.3
}
```


⚠️ <i>Experimental</i> <span style='white-space: pre;'> | </span> <span>v2.9.x+</span>

Import a snippet which responds with a configurable "hello world" message and content-type:

```caddy
(hello-world) {
	header {
		Cache-Control max-age=3600
		X-Foo bar
		{blocks.content_type}
	}
	respond /hello-world 200 {
		{blocks.body}
	}
}

example.com {
	import hello-world {
		content_type {
			Content-Type text/html
		}
		body {
			body "<h1>hello world</h1>"
		}
	}
}
```

Import a snippet which provides extendable options for a reverse proxy:

```caddy
(extendable-proxy) {
	reverse_proxy {
		{blocks.proxy_target}
		{blocks.proxy_options}
	}
}

example.com {
	import extendable-proxy {
		proxy_target {
			to 10.0.0.1
		}
		proxy_options {
			transport http {
				tls
			}
		}
	}
}
```

Import a snippet that serves any set of directives, but with a pre-loaded middleware:

```caddy
(instrumented-route) {
	header {
		Alt-Svc `h3="0.0.0.0:443"; ma=2592000`
	}
	tracing {
		span args[0]
	}
	{block}
}

example.com {
	import instrumented-route example-com {
		respond "OK"
	}
}
```
