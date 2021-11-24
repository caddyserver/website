---
title: php_fastcgi (Caddyfile directive)
---

# php_fastcgi

An opinionated directive that proxies requests to a PHP FastCGI server such as php-fpm.

- [Syntax](#syntax)
- [Expanded Form](#expanded-form)
  - [Explanation](#explanation)
- [Examples](#examples)

Caddy's [`reverse_proxy`](/docs/caddyfile/directives/reverse_proxy) is capable of serving any FastCGI application, but this directive is tailored specifically for PHP apps. This directive is actually just a convenient way to use a longer, more common configuration (below).

It expects that any `index.php` at the site root acts as a router. If that is not desirable, either reconfigure the `try_files` option to modify the default rewrite behaviour, or take the [expanded form](#expanded-form) below as a basis and customize it to your needs.

It supports all the subdirectives of [`reverse_proxy`](/docs/caddyfile/directives/reverse_proxy) and passes them through to the underlying reverse_proxy handler, plus a few subdirectives that customize the FastCGI transport specifically.

**Most modern PHP apps work fine without extra subdirectives or customization.** Subdirectives are usually only used in certain edge cases or with legacy PHP apps.

## Syntax

```caddy-d
php_fastcgi [<matcher>] <php-fpm_gateways...> {
	root <path>
	split <substrings...>
	env [<key> <value>]
	index <filename>|off
	try_files <files...>
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
- **index** specifies the filename to treat as the directory index file. This affects the file matcher in the [expanded form](#expanded-form). Default: `index.php`. Can be set to `off` to disable rewriting to `index.php` when a matching file is not found.
- **try_files** specifies an override for the default try-files rewrite. See the [`try_files` directive](/docs/caddyfile/directives/try_files) for details. Default: `{path} {path}/index.php index.php`.
- **resolve_root_symlink** enables resolving the `root` directory to its actual value by evaluating a symbolic link, if one exists.
- **dial_timeout** is how long to wait when connecting to the upstream socket. Accepts [duration values](/docs/conventions#durations). Default: `3s`.
- **read_timeout** is how long to wait when reading from the FastCGI server. Accepts [duration values](/docs/conventions#durations). Default: no timeout.
- **write_timeout** is how long to wait when sending to the FastCGI server. Accepts [duration values](/docs/conventions#durations). Default: no timeout.


Since this directive is an opinionated wrapper over a reverse proxy, you can use any of reverse_proxy's subdirectives to customize it.


## Expanded form

The `php_fastcgi` directive (without subdirectives) is the same as the following configuration. Most modern PHP apps work well with this preset. If yours does not, feel free to borrow from this and customize it as needed instead of using the `php_fastcgi` shortcut.

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

### Explanation

- The first section deals with canonicalizing the request path. The goal is to ensure that requests that target a directory on disk actually have the trailing slash `/` added to the request path, so that only a single URL is valid for requests to that directory.

  This is performed by using a request matcher that matches only requests that _don't_ end in a slash, and which map to a directory on disk which contains an `index.php` file, and if it matches, performs a HTTP 308 redirect with the trailing slash appended. So, for example it would redirect the request to path `/foo` to `/foo/` (appending a `/`, to canonicalize the path to the directory), if `/foo/index.php` exists on disk.

- The next section deals with performing path rewrites based on whether a matching file exists on disk. This also has the side-effect of remembering the part of the path after `.php` (if the request path had `.php` in it). This is important for Caddy to correctly set the FastCGI environment variables.

  - First, it checks if `{path}` is a file that exists on disk. If so, it rewrites to that path. This essentially short-circuits the rest, and makes sure that requests to files that _do_ exists on disk don't get otherwise rewritten (see next steps below). So if for example you have a `/js/app.js` file on disk, then the request to that path will be kept the same.

  - Second, it checks if `{path}/index.php` is a file that exists on disk. If so, it rewrites to that path. For requests to a directory like `/foo/` it'll then look for `/foo//index.php` (which gets normalized to `/foo/index.php`), and rewrite the request to that path if it exists. This behaviour is sometimes useful if you're running a PHP app in a subdirectory of another.

  - Lastly, it'll rewrite to `index.php` if that file exists (it almost always should for modern PHP apps). This allows your PHP app to handle any request for paths that _don't_ map to files on disk, by using the `index.php` script as its entrypoint.

- And finally, the last section is what actually proxies the request to your PHP FastCGI (or PHP-FPM) service to actually run your PHP code. The request matcher will only match requests which end in `.php`, so, any file that _isn't_ a PHP script and that _does_ exist on disk, will _not_ be handled by this directive, and will fall through.

The `php_fastcgi` directive is not usually enough on its own. It should almost always be paired with the [`root` directive](/docs/caddyfile/directives/root) to set the location of your files on disk (for modern PHP apps, this may be `/var/www/html/public`, where the `public` directory is what contains your `index.php`), and the [`file_server` directive](/docs/caddyfile/directives/file_server) to serve your static files (your JS, CSS, images, etc) which aren't otherwise handled by this directive and fell through.



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

The [`root` directive](/docs/caddyfile/directives/root) is typically used to specify the directory containing the PHP scripts, and the [`file_server` directive](/docs/caddyfile/directives/file_server) to serve static files:

```caddy-d
root * /var/www/html/public
php_fastcgi 127.0.0.1:9000
file_server
```

For a PHP site which does not use `index.php` as an entrypoint, you may fallback to emitting a `404` error instead. The error may be handled with the [`handle_errors` directive](/docs/caddyfile/directives/handle_errors):

```caddy-d
php_fastcgi localhost:9000 {
	try_files {path} {path}/index.php =404
}
```
