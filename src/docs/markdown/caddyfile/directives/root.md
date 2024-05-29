---
title: root (Caddyfile directive)
---

# root

Sets the root path of the site, used by various matchers and directives that access the file system. If unset, the default site root is the current working directory.

Specifically, this directive sets the `{http.vars.root}` placeholder. It is mutually exclusive to other `root` directives in the same block, so it is safe to define multiple roots with matchers that intersect: they will not cascade and overwrite each other.

This directive does not automatically enable serving static files, so it is often used in conjunction with the [`file_server` directive](file_server) or the [`php_fastcgi` directive](php_fastcgi).


## Syntax

```caddy-d
root [<matcher>] <path>
```

- **&lt;path&gt;** is the path to use for the site root.

Prior to v2.8.0, the `<path>` argument could be confused by the parser for a [matcher token](/docs/caddyfile/matchers#syntax) if it began with `/`, so it was necessary to specify a wildcard matcher token (`*`).


## Examples

Set the site root to `/home/bob/public_html` (assumes Caddy is running as the user `bob`):

<aside class="tip">

If you're running Caddy as a systemd service, reading files from `/home` will not work, because the `caddy` user does not have "executable" permission on the `/home` directory (necessary for traversal). It's recommended that you place your files in `/srv` or `/var/www/html` instead.

</aside>


```caddy-d
root * /home/bob/public_html
```


<aside class="tip">

Note that prior to v2.8.0, a [wildcard matcher](/docs/caddyfile/matchers#wildcard-matchers) was required here because the first argument is ambiguous with a [path matcher](/docs/caddyfile/matchers#path-matchers), i.e. `root * /srv`, but it can now be simplified to `root /srv`.

</aside>


Set the site root to `public_html` (relative to current working directory) for all requests:

```caddy-d
root public_html
```

Change the site root only for requests in `/foo/*`:

```caddy-d
root /foo/* /home/user/public_html/foo
```

The `root` directive is commonly paired with [`file_server`](file_server) to serve static files and/or with [`php_fastcgi`](php_fastcgi) to serve a PHP site:

```caddy
example.com {
	root * /srv
	file_server
}
```
