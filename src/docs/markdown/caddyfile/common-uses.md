---
title: Common Caddyfile Uses
---

# Common Caddyfile Uses

This page presents some complete, minimal Caddyfile configurations for common use cases, which you might find helpful when building your own configs.

These are not drop-in solutions; you will have to customize your domain name, ports/sockets, directory paths, etc. They are intended to illustrate only the basic requirements for the most common use cases.

#### Menu

- [Static file server](#static-file-server)
- [Reverse proxy](#reverse-proxy)
- [PHP](#php)
- [Redirect `www.` subdomain](#redirect-www-subdomain)
- [Trailing slashes](#trailing-slashes)


## Static file server

```
example.com

root * /var/www  # optional; default root is current directory
file_server
```


## Reverse proxy

All requests:

```
example.com

reverse_proxy localhost:5000
```

Just requests having a path starting with `/api/`; static files for everything else:

```
example.com

reverse_proxy /api/* localhost:5000
root * /var/www  # optional; default root is current directory
file_server
```


## PHP

With FastCGI running, something like this works for most modern PHP apps:

```
example.com

php_fastcgi unix//run/php/php-fpm.sock
```

If your PHP site relies on static files too, you may need to enable a static file server (but this depends on your PHP app):

```
example.com

php_fastcgi /blog/* localhost:9000
root * /var/www  # optional; default root is current directory
file_server
```

## Redirect `www.` subdomain

To **add** the `www.` subdomain with an HTTP redirect:

```
example.com {
	redir https://www.example.com{uri}
}

www.example.com {
	...
}
```


To **remove** it:

```
www.example.com {
	redir https://example.com{uri}
}

example.com {
	...
}
```


## Trailing slashes

You will not usually need to configure this yourself; the [`file_server` directive](/docs/caddyfile/directives/file_server) will automatically add or remove trailing slashes from requests by way of HTTP redirects, depending on whether the requested resource is a directory or file, respectively.

HTTP redirects are external, but you can internally [`rewrite`](/docs/caddyfile/directives/rewrite) add the slash if you want both URIs to be used for the same resource.

To add or remove a trailing slash:

```
example.com

rewrite /add     /add/
rewrite /remove/ /remove
```

To perform the equivalent change externally (with a redirect), simply replaces `rewrite` with [`redir`](/docs/caddyfile/directives/redir):

```
example.com

redir /add     /add/
redir /remove/ /remove
```

