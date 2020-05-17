---
title: Common Caddyfile Patterns
---

# Common Caddyfile Patterns

This page demonstrates a few complete and minimal Caddyfile configurations for common use cases. These can be helpful starting points for your own Caddyfile documents.

These are not drop-in solutions; you will have to customize your domain name, ports/sockets, directory paths, etc. They are intended to illustrate some of the most common configuration patterns.

#### Menu

- [Static file server](#static-file-server)
- [Reverse proxy](#reverse-proxy)
- [PHP](#php)
- [Redirect `www.` subdomain](#redirect-www-subdomain)
- [Trailing slashes](#trailing-slashes)


## Static file server

```caddy
example.com

root * /var/www
file_server
```

As usual, the first line is the site address. The [`root` directive](/docs/caddyfile/directives/root) specifies the path to the root of the site (the `*` means to match all requests, so as to disambiguate from a [path matcher](/docs/caddyfile/matchers#path-matchers))&mdash;change the path to your site if it isn't the current working directory. Finally, we enable the [static file server](/docs/caddyfile/directives/file_server).


## Reverse proxy

Proxy all requests:

```caddy
example.com

reverse_proxy localhost:5000
```

Only proxy requests having a path starting with `/api/` and serve static files for everything else:

```caddy
example.com

root * /var/www
reverse_proxy /api/* localhost:5000
file_server
```


## PHP

With a PHP FastCGI service running, something like this works for most modern PHP apps:

```caddy
example.com

root * /var/www
php_fastcgi /blog/* localhost:9000
file_server
```

Customize the site root and path matcher accordingly; this example assumes PHP is only in the `/blog/` subdirectory&mdash;all other requests will be served as static files.

The [`php_fastcgi` directive](/docs/caddyfile/directives/php_fastcgi) is actually just a shortcut for [several pieces of configuration](/docs/caddyfile/directives/php_fastcgi#expanded-form).


## Redirect `www.` subdomain

To **add** the `www.` subdomain with an HTTP redirect:

```caddy
example.com {
	redir https://www.example.com{uri}
}

www.example.com {
}
```


To **remove** it:

```caddy
www.example.com {
	redir https://example.com{uri}
}

example.com {
}
```


## Trailing slashes

You will not usually need to configure this yourself; the [`file_server` directive](/docs/caddyfile/directives/file_server) will automatically add or remove trailing slashes from requests by way of HTTP redirects, depending on whether the requested resource is a directory or file, respectively.

However, if you need to, you can still enforce trailing slashes with your config. There are two ways to do it: internally or externally.

### Internal enforcement

This uses the [`rewrite`](/docs/caddyfile/directives/rewrite) directive. Caddy will rewrite the URI internally to add or remove the trailing slash:

```caddy
example.com

rewrite /add     /add/
rewrite /remove/ /remove
```

Using a rewrite, requests with and without the trailing slash will be the same.


### External enforcement

This uses the [`redir`](/docs/caddyfile/directives/redir) directive. Caddy will ask the browser to change the URI to add or remove the trailing slash:

```caddy
example.com

redir /add     /add/
redir /remove/ /remove
```

Using a redirect, the client will have to re-issue the request, enforcing a single acceptable URI for a resource.
