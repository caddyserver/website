---
title: import (Caddyfile directive)
---

# import

Includes a [snippet](/docs/caddyfile/concepts#snippets) or file, replacing this directive with the contents of the snippet or file.

This directive is a special case: it is evaluated before the structure is parsed, and it can appear anywhere in the Caddyfile.

## Syntax

```caddy-d
import <pattern> [<args...>]
```

- **&lt;pattern&gt;** is the filename, glob pattern, or name of [snippet](/docs/caddyfile/concepts#snippets) to include. Its contents will replace this line as if that file's contents appeared here to begin with. It is an error if a specific file cannot be found, but an empty glob pattern is not an error. If the pattern is a filename or glob, it is always relative to the file the `import` appears in.
- **&lt;args...&gt;** is an optional list of arguments to pass to the imported tokens. They can be used with a placeholder of the form `{args.N}` where `N` is the 0-based positional index of the parameter. This placeholder is a special case and is evaluated at parse-time, not run-time.


## Examples

Import all files in an adjacent sites-enabled folder:

```caddy-d
import sites-enabled/*
```

Import a snippet that sets CORS headers using an import argument:

```caddy
(cors) {
	@origin header Origin {args.0}
	header @origin Access-Control-Allow-Origin "{args.0}"
	header @origin Access-Control-Allow-Methods "OPTIONS,HEAD,GET,POST,PUT,PATCH,DELETE"
}

example.com {
	import cors example.com
}
```
