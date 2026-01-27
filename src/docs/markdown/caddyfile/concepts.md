---
title: Caddyfile Concepts
---

# Caddyfile Concepts

This document will help you learn about the HTTP Caddyfile in detail.

1. [Structure](#structure)
	- [Blocks](#blocks)
	- [Directives](#directives)
	- [Tokens and quotes](#tokens-and-quotes)
2. [Global options](#global-options)
3. [Addresses](#addresses)
4. [Matchers](#matchers)
5. [Placeholders](#placeholders)
6. [Snippets](#snippets)
7. [Named Routes](#named-routes)
8. [Comments](#comments)
9. [Environment variables](#environment-variables)



## Structure

The Caddyfile's structure can be described visually:

<style>
	:root {
		--struct-border-global: #e74c3c;
		--struct-border-snippet: #2ecc71;
		--struct-border-site: #3498db;
		--struct-border-matcher: #d453d4;
		--struct-bg-1: #edf5fd;
		--struct-bg-2: #f8fbfd;
		--struct-bg-end: 100%;
		--struct-fg: #254048;
		--struct-opt-name-bg: #ffd9dd;
		--struct-opt-name-fg: #7a2a39;
		--struct-opt-value-bg: #f4dec6;
		--struct-opt-value-fg: #5a3723;
		--struct-comment-bg: #d2d7d8;
		--struct-comment-fg: #495456;
		--struct-site-addr-bg: #cbe4f2;
		--struct-site-addr-fg: #1f6f9a;
		--struct-directive-bg: #c8f7d6;
		--struct-directive-fg: #14663a;
		--struct-matcher-token-bg: #ffd6ff;
		--struct-matcher-token-fg: #6f2070;
		--struct-arg-bg: #ded0ff;
		--struct-arg-fg: #4b2f7a;
		--struct-subdir-bg: #dbbca2;
		--struct-subdir-fg: #5b3a25;
	}
	html.dark {
		--struct-border-global: #e74c3c;
		--struct-border-snippet: #2ecc71;
		--struct-border-site: #3498db;
		--struct-border-matcher: #d453d4;
		--struct-bg-1: #0d313c;
		--struct-bg-2: transparent;
		--struct-bg-end: 120%;
		--struct-fg: #cbd6da;
		--struct-opt-name-bg: #6b2630;
		--struct-opt-name-fg: #ffd9dd;
		--struct-opt-value-bg: #68412b;
		--struct-opt-value-fg: #f4dec6;
		--struct-comment-bg: #2f424d;
		--struct-comment-fg: #e8eef0;
		--struct-site-addr-bg: #204d59;
		--struct-site-addr-fg: #d6f0ff;
		--struct-directive-bg: #1f4e36;
		--struct-directive-fg: #c8f7d6;
		--struct-matcher-token-bg: #65305a;
		--struct-matcher-token-fg: #ffd6ff;
		--struct-arg-bg: #3b2e46;
		--struct-arg-fg: #ded0ff;
		--struct-subdir-bg: #6a4a2e;
		--struct-subdir-fg: #ebc095;
	}
	/* color variables - easy to tweak */
	.struct-caddyfile-visual-repl {
		display: block;
		margin: 0;
		padding: 0;
	}
	/* default (light) visual background */
	.struct-caddyfile-visual-repl .struct-visual {
		box-sizing: border-box;
		margin: 0 0 1.25rem;
		padding: 14px;
		border-radius: 14px;
		background: linear-gradient(to bottom, var(--struct-bg-1) 0%, var(--struct-bg-2) var(--struct-bg-end));
		color: var(--struct-fg);
		font-family: Inter, 'Source Sans Pro', Arial, system-ui, sans-serif;
		line-height: 1.2;
	}
	/* layout */
	.struct-caddyfile-visual-repl .struct-panel {
		display: flex;
		gap: 18px;
		align-items: flex-start;
		flex-wrap: wrap;
	}
	.struct-caddyfile-visual-repl .struct-diagram {
		flex: 1;
		padding: 8px 8px;
	}
	.struct-caddyfile-visual-repl .struct-legend {
		width: 310px;
		padding: 12px 4px;
	}
	/* code-like box: use normal whitespace so HTML pretty-printing won't leak source indentation */
	.struct-caddyfile-visual-repl .struct-code-box {
		background: transparent;
		border-radius: 8px;
		padding: 6px 6px !important;
		font-family: var(--monospace-fonts);
		font-size: 90%;
		white-space: normal;
	}
	.struct-block {
		border-radius: 8px;
		padding: 10px;
		margin: 0 0 10px 0;
	}
	.struct-block.global {
		border: 4px solid var(--struct-border-global);
	}
	.struct-block.snippet {
		border: 4px solid var(--struct-border-snippet);
	}
	.struct-block.site {
		border: 4px solid var(--struct-border-site);
	}
	.struct-block.matcher {
		border: 4px solid var(--struct-border-matcher);
		margin: 8px 8px 10px 10px;
		padding: 8px;
		border-radius: 6px;
	}
	.struct-token, .struct-opt-name, .struct-opt-value, .struct-comment, .struct-site-addr, .struct-directive, .struct-matcher-token, .struct-arg, .struct-subdir {
		display: inline !important;
		padding: .03rem .18rem !important;
		border-radius: 6px;
		font-family: var(--monospace-fonts);
		font-size: 95%;
		vertical-align: middle;
	}
	.struct-opt-name {
		background: var(--struct-opt-name-bg);
		color: var(--struct-opt-name-fg);
	}
	.struct-opt-value {
		background: var(--struct-opt-value-bg);
		color: var(--struct-opt-value-fg);
	}
	.struct-comment {
		background: var(--struct-comment-bg);
		color: var(--struct-comment-fg);
	}
	.struct-site-addr {
		background: var(--struct-site-addr-bg);
		color: var(--struct-site-addr-fg);
	}
	.struct-directive {
		background: var(--struct-directive-bg);
		color: var(--struct-directive-fg);
	}
	.struct-matcher-token {
		background: var(--struct-matcher-token-bg);
		color: var(--struct-matcher-token-fg);
	}
	.struct-arg {
		background: var(--struct-arg-bg);
		color: var(--struct-arg-fg);
	}
	.struct-subdir {
		background: var(--struct-subdir-bg);
		color: var(--struct-subdir-fg);
	}
	.struct-legend .struct-legend-title {
		font-weight: 700;
		font-size: 1.6rem;
	}
	.struct-legend .struct-item {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 16px 0;
	}
	.struct-legend .struct-item-spacer {
		height: 8px;
	}
	/* swatch for border-based legend items (blocks) */
	.struct-legend .struct-swatch-border {
		width: 42px;
		height: 24px;
		border-radius: 6px;
		box-sizing: border-box;
		border: 4px solid transparent;
		background: transparent;
	}
	/* swatch for filled legend items (text backgrounds) */
	.struct-legend .struct-swatch-fill {
		width: 42px;
		height: 24px;
		border-radius: 6px;
		box-sizing: border-box;
		background: transparent;
	}
	.struct-legend .struct-label {
		font-size: 90%;
		color: inherit;
	}
	.struct-caddyfile-visual-repl .struct-visual, .struct-caddyfile-visual-repl .struct-panel, .struct-caddyfile-visual-repl .struct-diagram, .struct-caddyfile-visual-repl .struct-legend, .struct-caddyfile-visual-repl .struct-code-box {
		margin: 0;
	}
	/* force compact vertical rhythm and explicit indenting so global CSS can't leak in
		NOTE: use normal whitespace so server-side HTML formatting doesn't create visible gaps */
	.struct-line {
		display: block !important;
		margin: 0 !important;
		padding: 2px 0 !important;
		line-height: 1.2 !important;
		white-space: normal !important;
	}
	/* helper to visually indent lines (do not rely on source file whitespace)
		use an explicit spacer element so HTML formatting won't affect alignment */
	.struct-line.struct-indent {
		padding-left: 0 !important;
	}
	.struct-indent-spacer {
		display: inline-block;
		width: 1.2rem;
		height: 1px;
		margin-right: 0.18rem;
	}
	/* smaller spacer for sub-directive / nested lines */
	.struct-subindent-spacer {
		display: inline-block;
		width: 0.9rem;
		height: 1px;
		margin-right: 0.12rem;
	}
</style>

<div class="struct-caddyfile-visual-repl fullwidth">
	<div class="struct-visual">
		<div class="struct-panel">
			<div class="struct-diagram">
				<div class="struct-code-box">
					<div class="struct-block global">
						<div class="struct-line">{</div>
						<div class="struct-line struct-indent"><span class="struct-indent-spacer"></span><span class="struct-opt-name">email</span> <span class="struct-opt-value">you@yours.com</span></div>
						<div class="struct-line struct-indent"><span class="struct-indent-spacer"></span><span class="struct-opt-name">servers</span> {</div>
						<div class="struct-line struct-indent"><span class="struct-indent-spacer"></span><span class="struct-indent-spacer"></span><span class="struct-subdir">trusted_proxies</span> <span class="struct-arg">static</span> <span class="struct-arg">private_ranges</span></div>
						<div class="struct-line"><span class="struct-indent-spacer"></span>}</div>
						<div class="struct-line">}</div>
					</div>
					<div class="struct-block snippet">
						<div class="struct-line">(snippet) {</div>
						<div class="struct-line struct-indent"><span class="struct-indent-spacer"></span><span class="struct-comment"># this is a reusable snippet</span></div>
						<div class="struct-line struct-indent"><span class="struct-indent-spacer"></span><span class="struct-directive">log</span> {</div>
						<div class="struct-line"><span class="struct-subindent-spacer"></span><span class="struct-indent-spacer"></span><span class="struct-subdir">output</span> <span class="struct-arg">file</span> <span class="struct-arg">/var/log/access.log</span></div>
						<div class="struct-line"><span class="struct-indent-spacer"></span>}</div>
						<div class="struct-line">}</div>
					</div>
					<div class="struct-block site">
						<div class="struct-line"><span class="struct-site-addr">example.com</span> {</div>
						<div class="struct-block matcher">
							<div class="struct-line"><span class="struct-matcher-token">@post</span> {</div>
							<div class="struct-line"><span class="struct-subindent-spacer"></span><span class="struct-matcher-token">method</span> <span class="struct-arg">POST</span></div>
							<div class="struct-line">}</div>
						</div>
						<div class="struct-line struct-indent"><span class="struct-indent-spacer"></span><span class="struct-directive">reverse_proxy</span> <span class="struct-matcher-token">@post</span> <span class="struct-arg">localhost:9001</span> <span class="struct-arg">localhost:9002</span> {</div>
						<div class="struct-line"><span class="struct-subindent-spacer"></span><span class="struct-indent-spacer"></span><span class="struct-subdir">lb_policy</span> <span class="struct-arg">first</span></div>
						<div class="struct-line"><span class="struct-indent-spacer"></span>}</div>
						<div class="struct-line struct-indent"><span class="struct-indent-spacer"></span><span class="struct-directive">file_server</span> <span class="struct-matcher-token">/static</span></div>
						<div class="struct-line struct-indent"><span class="struct-indent-spacer"></span><span class="struct-directive">import</span> <span class="struct-arg">snippet</span></div>
						<div class="struct-line">}</div>
					</div>
					<div class="struct-block site">
						<div class="struct-line struct-indent"><span class="struct-site-addr">www.example.com</span> {</div>
						<div class="struct-line struct-indent"><span class="struct-indent-spacer"></span><span class="struct-directive">redir</span> <span class="struct-arg">https://example.com{uri}</span></div>
						<div class="struct-line struct-indent"><span class="struct-indent-spacer"></span><span class="struct-directive">import</span> <span class="struct-arg">snippet</span></div>
						<div class="struct-line">}</div>
					</div>
				</div>
			</div>
			<div class="struct-legend" aria-hidden="false">
				<div class="struct-legend-title">Legend</div>
				<div class="struct-item-spacer"></div>
				<div class="struct-item"><div class="struct-swatch-border" style="border-color:var(--struct-border-global)"></div><div class="struct-label">Global options block</div></div>
				<div class="struct-item"><div class="struct-swatch-border" style="border-color:var(--struct-border-snippet)"></div><div class="struct-label">Snippet</div></div>
				<div class="struct-item"><div class="struct-swatch-border" style="border-color:var(--struct-border-site)"></div><div class="struct-label">Site block</div></div>
				<div class="struct-item"><div class="struct-swatch-border" style="border-color:var(--struct-border-matcher)"></div><div class="struct-label">Matcher definition</div></div>
				<div class="struct-item-spacer"></div>
				<div class="struct-item"><div class="struct-swatch-fill" style="background:var(--struct-opt-name-bg)"></div><div class="struct-label">Option name</div></div>
				<div class="struct-item"><div class="struct-swatch-fill" style="background:var(--struct-opt-value-bg)"></div><div class="struct-label">Option value</div></div>
				<div class="struct-item"><div class="struct-swatch-fill" style="background:var(--struct-comment-bg)"></div><div class="struct-label">Comment</div></div>
				<div class="struct-item"><div class="struct-swatch-fill" style="background:var(--struct-site-addr-bg)"></div><div class="struct-label">Site address</div></div>
				<div class="struct-item"><div class="struct-swatch-fill" style="background:var(--struct-directive-bg)"></div><div class="struct-label">Directive</div></div>
				<div class="struct-item"><div class="struct-swatch-fill" style="background:var(--struct-matcher-token-bg)"></div><div class="struct-label">Matcher token</div></div>
				<div class="struct-item"><div class="struct-swatch-fill" style="background:var(--struct-arg-bg)"></div><div class="struct-label">Argument</div></div>
				<div class="struct-item"><div class="struct-swatch-fill" style="background:var(--struct-subdir-bg)"></div><div class="struct-label">Subdirective</div></div>
			</div>
		</div>
	</div>
</div>

Key points:

- An optional [**global options block**](#global-options) can be the very first thing in the file.

- [Snippets](#snippets) or [named routes](#named-routes) may optionally appear next.

- Otherwise, the first line of the Caddyfile is **always** the [address(es)](#addresses) of the site to serve.

- All [directives](#directives) and [matchers](#matchers) **must** go in a site block. There is no global scope or inheritance across site blocks.

- If there is only one site block, its curly braces `{ }` are optional.

A Caddyfile consists of at least one or more site blocks, which always starts with one or more [addresses](#addresses) for the site. Any directives appearing before the address will be confusing to the parser.


### Blocks

Opening and closing a **block** is done with curly braces:

```
... {
	...
}
```

- The open curly brace `{` must be at the end of its line and preceded by a space.

- The close curly brace `}` must be on its own line.

When there is only one site block, the curly braces (and indentation) are optional. This is for convenience to quickly define a single site, for example, this:

```caddy
localhost

reverse_proxy /api/* localhost:9001
file_server
```

is equivalent to:

```caddy
localhost {
	reverse_proxy /api/* localhost:9001
	file_server
}
```

when you have only a single site block; it's a matter of preference.

To configure multiple sites with the same Caddyfile, you **must** use curly braces around each one to separate their configurations:

```caddy
example1.com {
	root * /www/example.com
	file_server
}

example2.com {
	reverse_proxy localhost:9000
}
```

If a request matches multiple site blocks, the site block with the most specific matching address is chosen. Requests don't cascade into to other site blocks.


### Directives

[**Directives**](/docs/caddyfile/directives) are functional keywords which customize how the site is served. They **must** appear within site blocks. For example, a complete file server config might look like this:

```caddy
localhost {
	file_server
}
```

Or a reverse proxy:

```caddy
localhost {
	reverse_proxy localhost:9000
}
```

In these examples, [`file_server`](/docs/caddyfile/directives/file_server) and [`reverse_proxy`](/docs/caddyfile/directives/reverse_proxy) are directives. Directives are the first word on a line in a site block.

In the second example, `localhost:9000` is an **argument** because it appears on the same line after the directive.

Sometimes directives can open their own blocks. **Subdirectives** appear on the beginning of each line within directive blocks:

```caddy
localhost {
	reverse_proxy localhost:9000 localhost:9001 {
		lb_policy first
	}
}
```

Here, `lb_policy` is a subdirective to [`reverse_proxy`](/docs/caddyfile/directives/reverse_proxy) (it sets the load balancing policy to use between backends).

**Unless otherwise documented, directives cannot be used within other directive blocks.** For example, [`basic_auth`](/docs/caddyfile/directives/basic_auth) cannot be used within [`file_server`](/docs/caddyfile/directives/file_server) because the file server does not know how to do authentication; but you can use directives within [`route`](/docs/caddyfile/directives/route), [`handle`](/docs/caddyfile/directives/handle), and [`handle_path`](/docs/caddyfile/directives/handle_path) blocks because they are specifically designed to group directives together.

Note that when the HTTP Caddyfile is adapted, HTTP handler directives are sorted according to a specific default [directive order](/docs/caddyfile/directives#directive-order) unless in a [`route`](/docs/caddyfile/directives/route) block, so the order of appearance of the directives does not matter except in `route` blocks.


### Tokens and quotes

The Caddyfile is lexed into tokens before being parsed. Whitespace is significant in the Caddyfile, because tokens are separated by whitespace.

Often, directives expect a certain number of arguments; if a single argument has a value with whitespace, it would be lexed as two separate tokens:

```caddy-d
directive abc def
```

This could be problematic and return errors or unexpected behavior.

If `abc def` is supposed to be the value of a single argument, it needs to be quoted:

```caddy-d
directive "abc def"
```

Quotes can be escaped if you need to use quotes in quoted tokens, too:

```caddy-d
directive "\"abc def\""
```

To avoid escaping quotes, you can instead use backticks <code>\` \`</code> to enclose tokens; for example:

```caddy-d
directive `{"foo": "bar"}`
```

Inside quoted tokens, all other characters are treated literally, including spaces, tabs, and newlines. Multi-line tokens are thus possible:

```caddy-d
directive "first line
	second line"
```

Heredocs <span id="heredocs"/> are also supported:

```caddy
example.com {
	respond <<HTML
		<html>
		  <head><title>Foo</title></head>
		  <body>Foo</body>
		</html>
		HTML 200
}
```

The opening heredoc marker must start with `<<`, followed by any text (uppercase letters recommended). The closing heredoc marker must be the same text (in the above example, `HTML`). The opening marker can be escaped with `\<<` to prevent heredoc parsing, if needed.

The closing marker can be indented, which causes every line of text to have that much indentation stripped (inspired by [PHP](https://www.php.net/manual/en/language.types.string.php#language.types.string.syntax.heredoc)) which is nice for readability inside [blocks](#blocks) while giving great control of the whitespace in the token text. The trailing newline is also stripped, but can be retained by adding an extra blank line before the closing marker.

Additional tokens may follow the closing marker as arguments to the directive (such as in the example above, the status code `200`).


## Global options

A Caddyfile may optionally start with a special block that has no keys, called a [global options block](/docs/caddyfile/options):

```caddy
{
	...
}
```

If present, it must be the very first block in the config.

It is used to set options that apply globally, or not to any one site in particular. Inside, only global options can be set; you cannot use regular site directives in them.

For example, to enable the `debug` global option, which is commonly used to produce verbose logs for troubleshooting:

```caddy
{
	debug
}
```

**[Read the Global Options page](/docs/caddyfile/options) to learn more.**



## Addresses

An address always appears at the top of the site block, and is usually the first thing in the Caddyfile.

These are examples of valid addresses:

| Address              | Effect                            |
|----------------------|-----------------------------------|
| `example.com`        | HTTPS with managed [publicly-trusted certificate](/docs/automatic-https#hostname-requirements) |
| `*.example.com`      | HTTPS with managed [wildcard publicly-trusted certificate](/docs/caddyfile/patterns#wildcard-certificates) |
| `localhost`          | HTTPS with managed [locally-trusted certificate](/docs/automatic-https#local-https) |
| `http://`            | HTTP catch-all, affected by [`http_port`](/docs/caddyfile/options#http-port) |
| `https://`           | HTTPS catch-all, affected by [`https_port`](/docs/caddyfile/options#http-port) |
| `http://example.com` | HTTP explicitly, with a `Host` matcher |
| `example.com:443`    | HTTPS due to matching the [`https_port`](/docs/caddyfile/options#http-port) default |
| `:443`               | HTTPS catch-all due to matching the [`https_port`](/docs/caddyfile/options#http-port) default |
| `:8080`              | HTTP on non-standard port, no `Host` matcher |
| `localhost:8080`     | HTTPS on non-standard port, due to having a valid domain |
| `https://example.com:443` | HTTPS, but both `https://` and `:443` are redundant |
| `127.0.0.1` | HTTPS, with a locally-trusted IP certificate |
| `http://127.0.0.1` | HTTP, with an IP address `Host` matcher (rejects `localhost`) |


<aside class="tip">

[Automatic HTTPS](/docs/automatic-https) is enabled if your site's address contains a hostname or IP address. This behavior is purely implicit, however, so it never overrides any explicit configuration.

For example, if the site's address is `http://example.com`, auto-HTTPS will not activate because the scheme is explicitly `http://`.

</aside>


From the address, Caddy can potentially infer the scheme, host and port of your site. If the address is without a port, the Caddyfile will choose the port matching the scheme if specified, or the default port of 443 will be assumed.

If you specify a hostname, only requests with a matching `Host` header will be honored. In other words, if the site address is `localhost`, then Caddy will not match requests to `127.0.0.1`.

Wildcards (`*`) may be used, but only to represent precisely one label of the hostname. For example, `*.example.com` matches `foo.example.com` but not `foo.bar.example.com`, and `*` matches `localhost` but not `example.com`. See the [wildcard certificates pattern](/docs/caddyfile/patterns#wildcard-certificates) for a practical example.

To catch all hosts, omit the host portion of the address, for example, simply `https://`. This is useful when using [On-Demand TLS](/docs/automatic-https#on-demand-tls), when you don't know the domains ahead of time.

If multiple sites share the same definition, you can list all of them together, separated with spaces and commas (at least one space is necessary). The following three examples are equivalent:

```caddy
# Comma separated site addresses
localhost:8080, example.com, www.example.com {
	...
}
```

or

```caddy
# Space separated site addresses
localhost:8080 example.com www.example.com {
	...
}
```

or

```caddy
# Comma and new-line separated site addresses
localhost:8080,
example.com,
www.example.com {
	...
}
```

An address must be unique; you cannot specify the same address more than once.

[Placeholders](#placeholders) **cannot** be used in addresses, but you may use Caddyfile-style [environment variables](#environment-variables) in them:

```caddy
{$DOMAIN:localhost} {
	...
}
```

By default, sites bind on all network interfaces. If you wish to override this, use the [`bind` directive](/docs/caddyfile/directives/bind) or the [`default_bind` global option](/docs/caddyfile/options#default-bind) to do so.



## Matchers

HTTP handler [directives](#directives) apply to all requests by default (unless otherwise documented).

[Request matchers](/docs/caddyfile/matchers) can be used to classify requests by a given criteria. With matchers, you can specify exactly which requests a certain directive applies to.

For directives that support matchers, the first argument after the directive is the **matcher token**. Here are some examples:

```caddy-d
root *           /var/www  # matcher token: *
root /index.html /var/www  # matcher token: /index.html
root @post       /var/www  # matcher token: @post
```

Matcher tokens can be omitted entirely to match all requests; for example, `*` does not need to be given if the next argument does not look like a path matcher.

**[Read the Request Matchers page](/docs/caddyfile/matchers) to learn more.**




## Placeholders

[Placeholders](/docs/conventions#placeholders) are a simple way to inject dynamic values into your static configuration. They can be used as arguments to directives and subdirectives.

Placeholders are bounded on either side by curly braces `{ }` and contain the identifier inside, for example: `{foo.bar}`. The opening placeholder brace can be escaped `\{like.this}` to prevent replacement. Placeholder identifiers are typically namespaced with dots to avoid collisions across modules.

Which placeholders are available depends on the context. Not all placeholders are available in all parts of the config. For example, [the HTTP app sets placeholders](/docs/json/apps/http/#docs) that are only available in areas of the config related to handling HTTP requests (i.e. in HTTP handler [directives](#directives) and [matchers](#matchers), but _not_ in [`tls` configuration](/docs/caddyfile/directives/tls)). Some directives or matchers may set their own placeholders too which can be used by anything that follows them. Some placeholders [are globally available](/docs/conventions#placeholders).

You can use any placeholders in the Caddyfile, but for convenience you can also use some of these equivalent shorthands which are expanded when the Caddyfile is parsed:

| Shorthand        | Replaces                            |
|------------------|-------------------------------------|
| `{cookie.*}`     | `{http.request.cookie.*}`           |
| `{client_ip}`    | `{http.vars.client_ip}`             |
| `{dir}`          | `{http.request.uri.path.dir}`       |
| `{err.*}`        | `{http.error.*}`                    |
| `{file_match.*}` | `{http.matchers.file.*}`            |
| `{file.base}`    | `{http.request.uri.path.file.base}` |
| `{file.ext}`     | `{http.request.uri.path.file.ext}`  |
| `{file}`         | `{http.request.uri.path.file}`      |
| `{header.*}`     | `{http.request.header.*}`           |
| `{host}`         | `{http.request.host}`               |
| `{hostport}`     | `{http.request.hostport}`           |
| `{labels.*}`     | `{http.request.host.labels.*}`      |
| `{method}`       | `{http.request.method}`             |
| `{path.*}`       | `{http.request.uri.path.*}`         |
| `{path}`         | `{http.request.uri.path}`           |
| `{port}`         | `{http.request.port}`               |
| `{query.*}`      | `{http.request.uri.query.*}`        |
| `{query}`        | `{http.request.uri.query}`          |
| `{re.*}`         | `{http.regexp.*}`                   |
| `{remote_host}`  | `{http.request.remote.host}`        |
| `{remote_port}`  | `{http.request.remote.port}`        |
| `{remote}`       | `{http.request.remote}`             |
| `{rp.*}`         | `{http.reverse_proxy.*}`            |
| `{resp.*}`       | `{http.intercept.*}`                |
| `{scheme}`       | `{http.request.scheme}`             |
| `{tls_cipher}`   | `{http.request.tls.cipher_suite}`   |
| `{tls_client_certificate_der_base64}` | `{http.request.tls.client.certificate_der_base64}` |
| `{tls_client_certificate_pem}`        | `{http.request.tls.client.certificate_pem}` |
| `{tls_client_fingerprint}`            | `{http.request.tls.client.fingerprint}`     |
| `{tls_client_issuer}`                 | `{http.request.tls.client.issuer}`          |
| `{tls_client_serial}`                 | `{http.request.tls.client.serial}`          |
| `{tls_client_subject}`                | `{http.request.tls.client.subject}`         |
| `{tls_version}`       | `{http.request.tls.version}`             |
| `{upstream_hostport}` | `{http.reverse_proxy.upstream.hostport}` |
| `{uri}`               | `{http.request.uri}`                     |
| `{vars.*}`            | `{http.vars.*}`                          |

Not all config fields support placeholders, but most do where you would expect it. Support for placeholders needs to have been explicitly added to those fields. Plugin authors can [read this article](/docs/extending-caddy/placeholders) to learn how to add support for placeholders in their own modules.




## Snippets

You can define special blocks called snippets by giving them a name surrounded in parentheses:

```caddy
(logging) {
	log {
		output file /var/log/caddy.log
		format json
	}
}
```

And then you can reuse this anywhere you need, using the special [`import`](/docs/caddyfile/directives/import) directive:

```caddy
example.com {
	import logging
}

www.example.com {
	import logging
}
```

The [`import`](/docs/caddyfile/directives/import) directive can also be used to include other files in its place. If the argument does not match a defined snippet, it will be tried as a file. It also supports globs to import multiple files. As a special case, it can appear anywhere within the Caddyfile (except as an argument to another directive), including outside of site blocks:

```caddy
{
	email admin@example.com
}

import sites/*
```

You can pass arguments to an imported configuration (snippets or files) and use them like so:

```caddy
(snippet) {
	respond "Yahaha! You found {args[0]}!"
}

a.example.com {
	import snippet "Example A"
}

b.example.com {
	import snippet "Example B"
}
```

⚠️ <i>Experimental</i> <span style='white-space: pre;'> | </span> <span>v2.9.x+</span>

You can also pass an optional block to an imported snippet, and use them as follows.

```caddy
(snippet) {
	{block}
	respond "OK"
}

a.example.com {
	import snippet {
		header +foo bar
	}
}

b.example.com {
	import snippet {
		header +bar foo
	}
}
```

**[Read the `import` directive page](/docs/caddyfile/directives/import) to learn more.**


## Named Routes

⚠️ <i>Experimental</i>

Named routes use syntax similar to [snippets](#snippets); they're a special block defined outside of site blocks, prefixed with `&(` and ending in `)` with the name in between.

```caddy
&(app-proxy) {
	reverse_proxy app-01:8080 app-02:8080 app-03:8080
}
```

And then you can reuse this named route within any site:

```caddy
example.com {
	invoke app-proxy
}

www.example.com {
	invoke app-proxy
}
```

This is particularly useful to reduce memory usage if the same route is needed in many different sites, or if multiple different matcher conditions are needed to invoke the same route.

**[Read the `invoke` directive page](/docs/caddyfile/directives/invoke) to learn more.**



## Comments

Comments start with `#` and proceed until the end of the line:

```caddy-d
# Comments can start a line
directive  # or go at the end
```

The hash character `#` for a comment cannot appear in the middle of a token (i.e. it must be preceded by a space or appear at the beginning of a line). This allows the use of hashes within URIs or other values without requiring quoting.



## Environment variables

If your configuration relies on environment variables, you can use them in the Caddyfile:

```caddy
{$ENV}
```

Environment variables in this form are substituted **before Caddyfile parsing begins**, so they can expand to empty values (i.e. `""`), partial tokens, complete tokens, or even multiple tokens and lines.

For example, an environment variable `UPSTREAMS="app1:8080 app2:8080 app3:8080"` would expand to multiple [tokens](#tokens-and-quotes):

```caddy
example.com {
	reverse_proxy {$UPSTREAMS}
}
```

A default value can be specified for when the environment variable is not found, by using `:` as the delimiter between the variable name and the default value:

```caddy
{$DOMAIN:localhost} {

}
```

If you want to **defer the substitution** of an environment variable until runtime, you can use the [standard `{env.*}` placeholders](/docs/conventions#placeholders). Note that not all config parameters support these placeholders though, since module developers need to add a line of code to perform the replacement. If it doesn't seem to work, please file an issue to request support for it.

For example, if you have the [`caddy-dns/cloudflare` plugin <img src="/old/resources/images/external-link.svg" class="external-link">](https://github.com/caddy-dns/cloudflare) installed and wish to configure the [DNS challenge](/docs/automatic-https#dns-challenge), you can pass your `CLOUDFLARE_API_TOKEN` environment variable to the plugin like this:

```caddy
{
	acme_dns cloudflare {env.CLOUDFLARE_API_TOKEN}
}
```

If you're running Caddy as a systemd service, see [these instructions](/docs/running#overrides) for setting service overrides to define your environment variables.
