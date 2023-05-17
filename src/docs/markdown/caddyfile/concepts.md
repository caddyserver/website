---
title: Caddyfile Concepts
---

# Caddyfile Concepts

This document will help you learn about the HTTP Caddyfile in detail.

1. [Structure](#structure)
	- [Blocks](#blocks)
	- [Directives](#directives)
	- [Tokens and quotes](#tokens-and-quotes)
2. [Addresses](#addresses)
3. [Matchers](#matchers)
4. [Placeholders](#placeholders)
5. [Snippets](#snippets)
6. [Comments](#comments)
7. [Environment variables](#environment-variables)
8. [Global options](#global-options)


## Structure

The Caddyfile's structure can be described visually:

![Caddyfile structure](/resources/images/caddyfile-visual.png)

Key points:

- An optional [**global options block**](#global-options) can be the very first thing in the file.
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
localhost

file_server
```

Or a reverse proxy:

```caddy
localhost

reverse_proxy localhost:9000
```

In these examples, [`file_server`](/docs/caddyfile/directives/file_server) and [`reverse_proxy`](/docs/caddyfile/directives/reverse_proxy) are directives. Directives are the first word on a line in a site block.

In the second example, `localhost:9000` is an **argument** because it appears on the same line after the directive.

Sometimes directives can open their own blocks. **Subdirectives** appear on the beginning of each line within directive blocks:

```caddy
localhost

reverse_proxy localhost:9000 localhost:9001 {
	lb_policy first
}
```

Here, `lb_policy` is a subdirective to [`reverse_proxy`](/docs/caddyfile/directives/reverse_proxy) (it sets the load balancing policy to use between backends).

**Unless otherwise documented, directives cannot be used within other directive blocks.** For example, `basicauth` cannot be used within `file_server` because the file server does not know how to do authentication; but you can use directives within [`route`](/docs/caddyfile/directives/route), [`handle`](/docs/caddyfile/directives/handle), and [`handle_path`](/docs/caddyfile/directives/handle_path) blocks because they are specifically designed to group directives together.

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

The opening heredoc marker must start with `<<`, followed by any text (uppercase letters recommended). The closing heredoc marker must be the same text (in the above example, `HTML`).

The closing marker can be indented, which causes every line of text to have that much indentation stripped (inspired by [PHP](https://www.php.net/manual/en/language.types.string.php#language.types.string.syntax.heredoc)) which is nice for readability inside [blocks](#blocks) while giving great control of the whitespace in the token text. The trailing newline is also stripped, but can be retained by adding an extra blank line before the closing marker.

Additional tokens may follow the closing marker as arguments to the directive (such as in the example above, the status code `200`).



## Addresses

An address always appears at the top of the site block, and is usually the first thing in the Caddyfile.

These are examples of valid addresses:

- `localhost`
- `example.com`
- `:443`
- `http://example.com`
- `localhost:8080`
- `127.0.0.1`
- `[::1]:2015`
- `*.example.com`
- `http://`


<aside class="tip">

[Automatic HTTPS](/docs/automatic-https) is enabled if your site's address contains a hostname or IP address. This behavior is purely implicit, however, so it never overrides any explicit configuration. For example, if the site's address is `http://example.com`, auto-HTTPS will not activate because the scheme is explicitly `http://`.

</aside>


From the address, Caddy can potentially infer the scheme, host and port of your site. If the address is without a port, the Caddyfile will choose the port matching the scheme if specified, or the default port of 443 will be assumed.

If you specify a hostname, only requests with a matching `Host` header will be honored. In other words, if the site address is `localhost`, then Caddy will not match requests to `127.0.0.1`.

Wildcards (`*`) may be used, but only to represent precisely one label of the hostname. For example, `*.example.com` matches `foo.example.com` but not `foo.bar.example.com`, and `*` matches `localhost` but not `example.com`. To catch all hosts, omit the host portion of the address.

If multiple sites share the same definition, you can list all of them together; notice how the commas indicate the continuation of addresses:

```caddy
localhost:8080, example.com, www.example.com
```

or

```caddy
localhost:8080,
example.com,
www.example.com
```

An address must be unique; you cannot specify the same address more than once.

By default, sites bind on all network interfaces. If you wish to override this, use the [`bind` directive](/docs/caddyfile/directives/bind) or the [`default_bind` global option](/docs/caddyfile/options#default-bind) to do so.



## Matchers

HTTP handler directives apply to all requests by default (unless otherwise documented).

[Request matchers](/docs/caddyfile/matchers) can be used to classify requests by a given criteria. This concept originates in the [underlying JSON](/docs/json/apps/http/servers/routes/match/) structure, and it's important to know how to use them in the Caddyfile. With matchers, you can specify exactly which requests a certain directive applies to.

For directives that support matchers, the first argument after the directive is the **matcher token**. Here are some examples:

```caddy-d
root *           /var/www  # matcher token: *
root /index.html /var/www  # matcher token: /index.html
root @post       /var/www  # matcher token: @post
```

Matcher tokens can be omitted entirely to match all requests; for example, `*` does not need to be given if the next argument does not look like a path matcher.

**[Read the page about request matchers](/docs/caddyfile/matchers) to learn more.**




## Placeholders

You can use any [Caddy placeholders](/docs/conventions#placeholders) in the Caddyfile, but for convenience you can also use some equivalent shorthand ones:

| Shorthand       | Replaces                          |
|-----------------|-----------------------------------|
| `{cookie.*}`    | `{http.request.cookie.*}`         |
| `{client_ip}`   | `{http.vars.client_ip}`           |
| `{dir}`         | `{http.request.uri.path.dir}`     |
| `{err.*}`       | `{http.error.*}` |
| `{file_match.*}` | `{http.matchers.file.*}` |
| `{file.base}`   | `{http.request.uri.path.file.base}` |
| `{file.ext}`    | `{http.request.uri.path.file.ext}`  |
| `{file}`        | `{http.request.uri.path.file}`    |
| `{header.*}`    | `{http.request.header.*}`         |
| `{host}`        | `{http.request.host}`             |
| `{hostport}`    | `{http.request.hostport}`         |
| `{labels.*}`    | `{http.request.host.labels.*}`    |
| `{method}`      | `{http.request.method}`           |
| `{path.*}`      | `{http.request.uri.path.*}`       |
| `{path}`        | `{http.request.uri.path}`         |
| `{port}`        | `{http.request.port}`             |
| `{query.*}`     | `{http.request.uri.query.*}`      |
| `{query}`       | `{http.request.uri.query}`        |
| `{re.*.*}`      | `{http.regexp.*.*}` |
| `{remote_host}` | `{http.request.remote.host}`      |
| `{remote_port}` | `{http.request.remote.port}`      |
| `{remote}`      | `{http.request.remote}`           |
| `{rp.*}`        | `{http.reverse_proxy.*}` |
| `{scheme}`      | `{http.request.scheme}`           |
| `{tls_cipher}`  | `{http.request.tls.cipher_suite}` |
| `{tls_client_certificate_der_base64}` | `{http.request.tls.client.certificate_der_base64}` |
| `{tls_client_certificate_pem}`        | `{http.request.tls.client.certificate_pem}` |
| `{tls_client_fingerprint}`            | `{http.request.tls.client.fingerprint}`     |
| `{tls_client_issuer}`                 | `{http.request.tls.client.issuer}`          |
| `{tls_client_serial}`                 | `{http.request.tls.client.serial}`          |
| `{tls_client_subject}`                | `{http.request.tls.client.subject}`         |
| `{tls_version}` | `{http.request.tls.version}`      |
| `{upstream_hostport}` | `{http.reverse_proxy.upstream.hostport}` |
| `{uri}`         | `{http.request.uri}`              |
| `{vars.*}`      | `{http.vars.*}` |



## Snippets

You can define special blocks called snippets by giving them a name surrounded in parentheses:

```caddy
(redirect) {
	@http {
		protocol http
	}
	redir @http https://{host}{uri}
}
```

And then you can reuse this anywhere you need:

```caddy-d
import redirect
```

The [`import`](/docs/caddyfile/directives/import) directive can also be used to include other files in its place. As a special case, it can appear almost anywhere within the Caddyfile.

You can pass arguments to imported configuration and use them like so:

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
{$SITE_ADDRESS}
```

Environment variables in this form are substituted before Caddyfile parsing begins, so they can expand to empty values, partial tokens, complete tokens, or even multiple tokens and lines.

A default value can be specified for when the environment variable is not found, by using `:` as the delimiter between the variable name and the default value:

```caddy
{$DOMAIN:localhost}
```

If you want to defer the substitution of an environment variable until runtime, you can use the [standard `{env.*}` placeholders](/docs/conventions#placeholders). Note that not all config parameters support these placeholders though, since module developers need to add a line of code to perform the replacement. If it doesn't seem to work, please file an issue to request support for it.



## Global options

A Caddyfile may optionally start with a special block that has no keys, called a [global options block](/docs/caddyfile/options):

```caddy
{
	...
}
```

If present, it must be the very first block in the config.

It is used to set options that apply globally, or not to any one site in particular. Inside, only global options can be set; you cannot use regular site directives in them.

[Learn more](/docs/caddyfile/options) about the global options block.
