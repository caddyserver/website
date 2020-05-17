---
title: root (Caddyfile directive)
---

# root

Sets the root path of the site, used by various matchers and directives that access the file system. If unset, the default site root is the current working directory.

Specifically, this directive sets the `{http.vars.root}` placeholder. It is mutually exclusive to other `root` directives in the same block, so it is safe to define multiple roots with matchers that intersect: they will not cascade and overwrite each other.

This directive does not automatically enable serving static files, so it is often used in conjunction with the [`file_server` directive](/docs/caddyfile/directives/file_server) or the [`php_fastcgi` directive](/docs/caddyfile/directives/php_fastcgi).


## Syntax

```caddy-d
root [<matcher>] <path>
```

- **&lt;path&gt;** is the path to use for the site root.

Note that the `<path>` argument could be confused by the parser as a [matcher token](/docs/caddyfile/matchers#syntax) if the it begins with `/`. To disambiguate, specify a wildcard matcher token (`*`). See examples below.

## Examples

Set the site root to `/home/user/public_html` for all requests:

(Note that a [wildcard matcher](/docs/caddyfile/matchers#wildcard-matchers) is required here because the first argument is ambiguous with a [path matcher](/docs/caddyfile/matchers#path-matchers).)

```caddy-d
root * /home/user/public_html
```

Set the site root to `public_html` (relative to current working directory) for all requests:

(No matcher token is required here because our site root is a relative path, so it does not start with a forward slash and thus is not ambiguous.)

```caddy-d
root public_html
```

Change the site root only for requests in `/foo/*`:

```caddy-d
root /foo/* /home/user/public_html/foo
```

The `root` directive is commonly paired with [`file_server`](/docs/caddyfile/directives/file_server) to serve static files and/or with [`php_fastcgi`](/docs/caddyfile/directives/php_fastcgi) to serve a PHP site:

```caddy-d
root * /home/user/public_html
file_server
```
