---
title: root (Caddyfile directive)
---

# root

Sets the root path of the site, used by various matchers and directives that access the file system. If unset, the default site root is the current working directory.

Specifically, this directive sets the `{http.vars.root}` placeholder.


## Syntax

```
root [<matcher>] <path>
```

- **&lt;path&gt;** is the path to use for the site root.

Note that a matcher token is usually required since the first argument is a path, which could look like a path matcher.

## Examples

Set the site root to `/home/user/public_html` for all requests:

```
root * /home/user/public_html
```

(A [wildcard matcher](/docs/caddyfile/concepts#wildcard-matcher) is required in this case because the first argument is ambiguous with a [path matcher](/docs/caddyfile/concepts#path-matcher).)

Set the site root to `public_html` (relative to current working directory) for all requests:

```
root public_html
```

(No matcher token is required here because our site root is a relative path, so it does not start with a forward slash and thus is not ambiguous.)

Set the site root only for requests in `/foo`:

```
root /foo/* /home/user/public_html/foo
```
