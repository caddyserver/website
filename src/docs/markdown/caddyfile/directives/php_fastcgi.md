---
title: php_fastcgi (Caddyfile directive)
---

# php_fastcgi

An opinionated directive that proxies requests to a PHP FastCGI server such as php-fpm.

Caddy's [reverse_proxy](/docs/caddyfile/directives/reverse_proxy) is capable of serving any FastCGI application, but this directive is tailored specifically for PHP apps. This directive is actually just a convenient way to use a longer, more common configuration (below).

It expects that any `index.php` at the site root acts as a router. If that is not desirable, either perform your own URI rewrite or use something like the [expanded form](#expanded-form) below and customize it to your needs.

It supports all the subdirectives of [reverse_proxy](/docs/caddyfile/directives/reverse_proxy) and passes them through to the underlying reverse_proxy handler, plus a few subdirectives that customize the FastCGI transport specifically.

**Most modern PHP apps work fine without extra subdirectives or customization.** Subdirectives are usually only used in certain edge cases or with legacy PHP apps.

## Syntax

```caddy-d
php_fastcgi [<matcher>] <php-fpm_gateways...> {
	root <path>
	split <substrings...>
	env [<key> <value>]
	index <filename>
	resolve_root_symlink
	dial_timeout  <duration>
	read_timeout  <duration>
	write_timeout <duration>

	<any other reverse_proxy subdirectives...>
}
```

- **<php-fpm_gateways...>** are the [addresses](/docs/conventions#network-addresses) of the FastCGI servers.
- **root** sets the root folder to the site. Default: [`root` directive](/docs/caddyfile/directives/root).
- **split** sets the substrings for splitting the URI into two parts. The first matching substring will be used to split the "path info" from the path. The first piece is suffixed with the matching substring and will be assumed as the actual resource (CGI script) name. The second piece will be set to PATH_INFO for the CGI script to use. Default: `.php`
- **env** sets an extra environment variable to the given value. Can be specified more than once for multiple environment variables.
- **index** specifies the filename to treat as the directory index file. This affects the file matcher in the [expanded form](#expanded-form). Default: `index.php`
- **resolve_root_symlink** enables resolving the `root` directory to its actual value by evaluating a symbolic link, if one exists.
- **dial_timeout** is how long to wait when connecting to the upstream socket. Accepts [duration values](/docs/conventions#durations). Default: no timeout.
- **read_timeout** is how long to wait when reading from the FastCGI server. Accepts [duration values](/docs/conventions#durations). Default: no timeout.
- **write_timeout** is how long to wait when sending to the FastCGI server. Accepts [duration values](/docs/conventions#durations). Default: no timeout.


Since this directive is an opinionated wrapper over a reverse proxy, you can use any of reverse_proxy's subdirectives to customize it.


## Expanded form

The `php_fastcgi` directive is the same as the following configuration:

```caddy-d
route {
	# Add trailing slash for directory requests
	@canonicalPath {
		file {path}/index.php
		not path */
	}
	redir @canonicalPath {path}/ 308

	# If the requested file does not exist, try index files
	@indexFiles file {
		try_files {path} {path}/index.php index.php
		split_path .php
	}
	rewrite @indexFiles {http.matchers.file.relative}

	# Proxy PHP files to the FastCGI responder
	@phpFiles path *.php
	reverse_proxy @phpFiles <php-fpm_gateway> {
		transport fastcgi {
			split .php
		}
	}
}
```

Most modern PHP apps work well with this preset. If yours does not, feel free to borrow from this and customize it as needed instead of using the `php_fastcgi` shortcut.

## Examples

Proxy all PHP requests to a FastCGI responder listening at 127.0.0.1:9000:

```caddy-d
php_fastcgi 127.0.0.1:9000
```

Same, but only for requests under `/blog/`:

```caddy-d
php_fastcgi /blog/* 127.0.0.1:9000
```

When using php-fpm listening via a unix socket:

```caddy-d
php_fastcgi unix//run/php/php7.4-fpm.sock
```

The [`root` directive](/docs/caddyfile/directives/root) is often used to specify the directory containing the PHP scripts, and the [`file_server` directive](/docs/caddyfile/directives/file_server) to serve static files:

```caddy-d
root * /var/www/html
php_fastcgi 127.0.0.1:9000
file_server
```
