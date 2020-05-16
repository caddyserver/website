---
title: import (Caddyfile directive)
---

# import

Includes a [snippet](/docs/caddyfile/concepts#snippets) or file, replacing this directive with the contents of the snippet or file.

This directive is a special case: it is evaluated before the structure is parsed, and it can appear anywhere in the Caddyfile.

## Syntax

```caddy-d
import <pattern>
```

- **&lt;pattern&gt;** is the filename, glob pattern, or name of [snippet](/docs/caddyfile/concepts#snippets) to include. Its contents will replace this line as if that file's contents appeared here to begin with. It is an error if a specific file cannot be found, but an empty glob pattern is not an error.


## Examples

Import all files in an adjacent sites-enabled folder:

```caddy-d
import sites-enabled/*
```
