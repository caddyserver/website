---
title: php_fastcgi (Caddyfile directive)
---

<script>
window.$(function() {
	// We'll add links to all the subdirectives if a matching anchor tag is found on the page.
	addLinksToSubdirectives();
});
</script>

# php_fastcgi

An opinionated directive that proxies requests to a PHP FastCGI server such as php-fpm.

- [Syntax](#syntax)
- [Expanded Form](#expanded-form)
  - [Explanation](#explanation)
- [Examples](#examples)

Caddy's [`reverse_proxy`](reverse_proxy) is capable of serving any FastCGI application, but this directive is tailored specifically for PHP apps. This directive is a convenient shortcut, replacing a [longer configuration](#expanded-form).

It expects that any `index.php` at the site root acts as a router. If that is not desirable, either reconfigure the [`try_files` subdirective](#try_files) to modify the default rewrite behaviour, or take the [expanded form](#expanded-form) as a basis and customize it to your needs.

In addition to the subdirectives listed below, this directive also supports all the subdirectives of [`reverse_proxy`](reverse_proxy#syntax). For example, you may enable load balancing and health checks.

**Most modern PHP apps work fine without extra subdirectives or customization.** Subdirectives are usually only used in certain edge cases or with legacy PHP apps.

## Syntax

```caddy-d
php_fastcgi [<matcher>] <php-fpm_gateways...> {
	root <path>
	split <substrings...>
	index <filename>|off
	try_files <files...>
	env [<key> <value>]
	resolve_root_symlink
	capture_stderr
	dial_timeout  <duration>
	read_timeout  <duration>
	write_timeout <duration>

	<any other reverse_proxy subdirectives...>
}
```

- **<php-fpm_gateways...>** are the [addresses](/docs/conventions#network-addresses) of the FastCGI servers. Typically, either a TCP socket, or a unix socket file.

- **root** <span id="root"/> sets the root folder to the site. It's recommended to always use the [`root` directive](root) in conjunction with `php_fastcgi`, but overriding this can be useful when your PHP-FPM upstream is using a different root than Caddy (see [an example](#docker)). Defaults to the value of the [`root` directive](root) if used, otherwise defaults to Caddy's current working directory.

- **split** <span id="split"/> sets the substrings for splitting the URI into two parts. The first matching substring will be used to split the "path info" from the path. The first piece is suffixed with the matching substring and will be assumed as the actual resource (CGI script) name. The second piece will be set to PATH_INFO for the CGI script to use. Default: `.php`

- **index** <span id="index"/> specifies the filename to treat as the directory index file. This affects the file matcher in the [expanded form](#expanded-form). Default: `index.php`. Can be set to `off` to disable rewrite fallback to `index.php` when a matching file is not found.

- **try_files** <span id="try_files"/> specifies an override for the default try-files rewrite. See the [`try_files` directive](try_files) for details. Default: `{path} {path}/index.php index.php`.

- **env** <span id="env"/> sets an extra environment variable to the given value. Can be specified more than once for multiple environment variables. By default, all the relevant FastCGI environment variables are already set (including HTTP headers) but you may add or override variables as needed. 

- **resolve_root_symlink** <span id="resolve_root_symlink"/> when the [`root`](#root) directory is a symbolic link (symlink), this enables resolving it to its actual value. This is sometimes used as a deployment strategy, by simply swapping the symlink to point to the new version in another directory. Disabled by default to avoid repeated system calls.

- **capture_stderr** <span id="capture_stderr"/> enables capturing and logging of any messages sent by the upstream fastcgi server on `stderr`. Logging is done at `WARN` level by default. If the response has a `4xx` or `5xx` status, then the `ERROR` level will be used instead. By default, `stderr` is ignored.

- **dial_timeout** <span id="dial_timeout"/> is a [duration value](/docs/conventions#durations) that sets how long to wait when connecting to the upstream socket. Default: `3s`.

- **read_timeout** <span id="read_timeout"/> is a [duration value](/docs/conventions#durations) that sets how long to wait when reading from the FastCGI upstream. Default: no timeout.

- **write_timeout** <span id="write_timeout"/> is a [duration value](/docs/conventions#durations) that sets how long to wait when sending to the FastCGI upstream. Default: no timeout.


Since this directive is an opinionated wrapper over a reverse proxy, you can use any of [`reverse_proxy`](reverse_proxy#syntax)'s subdirectives to customize it.


## Expanded form

The `php_fastcgi` directive (without subdirectives) is the same as the following configuration. Most modern PHP apps work well with this preset. If yours does not, feel free to borrow from this and customize it as needed instead of using the `php_fastcgi` shortcut.

```caddy-d
route {
	# Add trailing slash for directory requests
	# This redirection is automatically disabled if "{http.request.uri.path}/index.php"
	# doesn't appear in the try_files list
	@canonicalPath {
		file {path}/index.php
		not path */
	}
	redir @canonicalPath {http.request.orig_uri.path}/ 308

	# If the requested file does not exist, try index files and assume index.php always exists
	@indexFiles file {
		try_files {path} {path}/index.php index.php
		try_policy first_exist_fallback
		split_path .php
	}
	rewrite @indexFiles {file_match.relative}

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

  This canonicalization occurs only if the `try_files` subdirective contains `{path}/index.php` (the default).

  This is performed by using a request matcher that matches only requests that _don't_ end in a slash, and which map to a directory on disk which contains an `index.php` file, and if it matches, performs an HTTP 308 redirect with the trailing slash appended. So for example, it would redirect a request with path `/foo` to `/foo/` (appending a `/`, to canonicalize the path to the directory), if `/foo/index.php` exists on disk.

- The next section deals with performing path rewrites based on whether a matching file exists on disk. This also has the side-effect of remembering the part of the path after `.php` (if the request path had `.php` in it). This is important for Caddy to correctly set the FastCGI environment variables.

  - First, it checks if `{path}` is a file that exists on disk. If so, it rewrites to that path. This essentially short-circuits the rest, and makes sure that requests to files that _do exist_ on disk don't get otherwise rewritten (see next steps below). So if for example you have a `/js/app.js` file on disk, then the request to that path will be kept the same.

  - Second, it checks if `{path}/index.php` is a file that exists on disk. If so, it rewrites to that path. For requests to a directory like `/foo/` it'll then look for `/foo//index.php` (which gets normalized to `/foo/index.php`), and rewrite the request to that path if it exists. This behaviour is sometimes useful if you're running another PHP app in a subdirectory of your webroot.

  - Lastly, it'll always rewrite to `index.php` (it almost always exists for modern PHP apps). This allows your PHP app to handle any request for paths that _don't_ map to files on disk, by using the `index.php` script as its entrypoint.

- And finally, the last section is what actually proxies the request to your PHP FastCGI (or PHP-FPM) service to actually run your PHP code. The request matcher will only match requests which end in `.php`, so, any file that _isn't_ a PHP script and that _does_ exist on disk, will _not_ be handled by this directive, and will fall through.

The `php_fastcgi` directive is not usually enough on its own. It should almost always be paired with the [`root` directive](root) to set the location of your files on disk (for modern PHP apps, this may be `/var/www/html/public`, where the `public` directory is what contains your `index.php`), and the [`file_server` directive](file_server) to serve your static files (your JS, CSS, images, etc) which aren't otherwise handled by this directive and fell through.



## Examples

Proxy all PHP requests to a FastCGI responder listening at `127.0.0.1:9000`:

```caddy-d
php_fastcgi 127.0.0.1:9000
```

Same, but only for requests under `/blog/`:

```caddy-d
php_fastcgi /blog/* localhost:9000
```

When using PHP-FPM listening via a unix socket:

```caddy-d
php_fastcgi unix//run/php/php8.2-fpm.sock
```

The [`root` directive](root) is almost always used to specify the directory containing the PHP scripts, and the [`file_server` directive](file_server) to serve static files:

```caddy
example.com {
	root * /var/www/html/public
	php_fastcgi 127.0.0.1:9000
	file_server
}
```

<span id="docker"/> When serving multiple PHP apps with Caddy, your webroot for each app must be different so that Caddy can read and serve your static files separately and detect if PHP files exist.

If you're using Docker, often your PHP-FPM containers will have the files mounted at the same root. In that case, the solution is to mount the files to your Caddy container in different directories, then use the [`root` subdirective](#root) to set the root for each container:

```caddy
app1.example.com {
	root * /srv/app1/public
	php_fastcgi app1:9000 {
		root /var/www/html/public
	}
	file_server
}

app2.example.com {
	root * /srv/app2/public
	php_fastcgi app2:9000 {
		root /var/www/html/public
	}
	file_server
}
```

For a PHP site which does not use `index.php` as an entrypoint, you may fallback to emitting a `404` error instead. The error may be caught and handled with the [`handle_errors` directive](handle_errors):

```caddy
example.com {
	php_fastcgi localhost:9000 {
		try_files {path} {path}/index.php =404
	}

	handle_errors {
		respond "{err.status_code} {err.status_text}"
	}
}
```
