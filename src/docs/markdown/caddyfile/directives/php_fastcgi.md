---
title: php_fastcgi (Caddyfile directive)
---

# php_fastcgi

An opinionated directive that proxies requests to a PHP FastCGI server such as php-fpm.

Caddy's [reverse_proxy](/docs/caddyfile/directives/reverse_proxy) is capable of serving any FastCGI application, but this directive is tailored specifically for PHP apps. This directive is actually just a convenient way to use a longer, more common configuration (below).

It expects that any `index.php` at the site root acts as a router. If that is not desirable, either perform your own URI rewrite or use something like the [expanded form](#expanded-form) below and customize it to your needs.


## Syntax

```
php_fastcgi [<matcher>] <php-fpm_gateway>
```

- **<php-fpm_gateway>** is the address of the FastCGI server.

Since this directive is an opinionated wrapper over a reverse proxy, you can open a block and use any of reverse_proxy's subdirectives to customize it.


## Expanded form

The `php_fastcgi` directive is the same as the following configuration:

```
# Add trailing slash for directory requests
@canonicalPath {
	file {
		try_files {path}/index.php
	}
	not {
		path */
	}
}
redir @canonicalPath {path}/ 308

# If the requested file does not exist, try index files
try_files {path} {path}/index.php index.php

# Proxy PHP files to the FastCGI responder
@phpFiles {
	path *.php
}
reverse_proxy @phpFiles <php-fpm_gateway> {
	transport fastcgi {
		split .php
	}
}
```

Most modern PHP apps work well with this preset. If yours does not, feel free to borrow from this and customize it as needed instead of using the `php_fastcgi` shortcut.

## Examples

Proxy all PHP requests to a FastCGI responder listening at 127.0.0.1:9000:

```
php_fastcgi 127.0.0.1:9000
```

Same, but only for requests under `/blog/`:

```
php_fastcgi /blog/* 127.0.0.1:9000
```

When using php-fpm listening via a unix socket:

```
php_fastcgi unix//run/php/php7.4-fpm.sock
```
