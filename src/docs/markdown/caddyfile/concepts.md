---
title: Caddyfile Concepts
---

# Caddyfile Concepts

This document will help you learn about the HTTP Caddyfile in detail.

1. [Structure](#structure)
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

- An optional **global options block** can be the very first thing in the file.
- Otherwise, the first line of the Caddyfile is **always** the address(es) of the site to serve.
- All directives and matchers **must** go in a site block. There is no global scope or inheritence across site blocks.
- If there is **only one site block**, its curly braces `{ }` are optional.

A Caddyfile consists of at least one or more site blocks, which always starts with one or more [addresses](#addresses) for the site. Any directives appearing before the address will be confusing to the parser.

### Blocks

Opening and closing a **block** is done with curly braces:

```
... {
	...
}
```

- The open curly brace `{` must be at the end of its line.
- The close curly brace `}` must be on its own line.

When there is only one site block, the curly braces (and indentation) are optional. This is for convenience to quickly define a single site, for example, this:

```
localhost

reverse_proxy /api/* localhost:9001
file_server
```

is equivalent to:

```
localhost {
	reverse_proxy /api/* localhost:9001
	file_server
}
```

when you have only a single site block; it's a matter of preference.

To configure multiple sites with the same Caddyfile, you **must** use curly braces around each one to separate their configurations:

```
example1.com {
	root * /www/example.com
	file_server
}

example2.com {
	reverse_proxy localhost:9000
}
```

### Directives

**Directives** are keywords which customize how the site is served. For example, a complete file server config might look like this:

```
localhost

file_server
```

Or a reverse proxy:

```
localhost

reverse_proxy localhost:9000
```

In these examples, `file_server` and `reverse_proxy` are directives. Directives are the first word on a line in a site block.

In the second example, `localhost:9000` is an **argument** because it appears on the same line after the directive.

**Subdirectives** can appear in directive blocks:

```
localhost

reverse_proxy localhost:9000 localhost:9001 {
	lb_policy first
}
```

Here, `lb_policy` is a subdirective to `reverse_proxy` (it sets the load balancing policy to use between backends).




## Addresses

An address always appears at the top of the site block, and is usually the first thing in the Caddyfile.

These are examples of valid addresses:

<aside class="tip">
	<a href="/docs/automatic-https">Automatic HTTPS</a> is enabled if your site's address contains a real-looking domain name. This behavior is purely implicit, however, so it never overrides any explicit configuration. For example, if the site's address is <code>http://example.com</code>, auto-HTTPS will not activate because the scheme is http.
</aside>

- `localhost`
- `example.com`
- `:443`
- `http://example.com`
- `localhost:8080`
- `127.0.0.1`
- `[::1]:2015`
- `example.com/foo/*`

From the address, Caddy can potentially infer the scheme, host, port, and path of your site. The default port is 2015 unless [automatic HTTPS](/docs/automatic-https#activation) is activated, which changes it to the HTTPS port.

If you specify a hostname, only requests with a matching Host header will be honored. In other words, if the site address is `localhost`, then Caddy will not match requests to `127.0.0.1`.

If multiple sites share the same definition, you can list all of them together:

```
localhost:8080, example.com, www.site.com
```

or

```
localhost:8080,
example.com,
www.site.com
```

Notice how the commas indicate the continuation of addresses.

An address must be unique; you cannot specify the same address more than once.


## Matchers

By default, a directive that injects an HTTP handler applies to all requests (unless otherwise documented).

**Request matchers** can be used to classify requests by a given criteria. This concept originates in the [underlying JSON](/docs/json/apps/http/servers/routes/match/) structure, and it's important to know how to use them in the Caddyfile. With matchers, you can specify exactly which requests a directive applies to.

To limit a directive's scope, use a **matcher token** immediately after the directive. It can be one of these forms:

1. **`*`** to match all requests (wildcard; default).
2. **`/path`** start with a forward slash to match a request path.
3. **`@name`** to specify a _named matcher_.

Matcher tokens are usually optional. If a matcher token is omitted, it is the same as a wildcard matcher (`*`).

### Wildcard matcher

The wildcard matcher `*` matches all requests, and is only needed if a matcher token is required. For example, if the first argument you want to give a directive also happens to be a path, it would look exactly like a path matcher! So you can use a wildcard matcher to disambiguate, for example:

```
root * /home/www/mysite
```

Otherwise, this matcher is not often used. It is convenient to omit it when possible; just a matter of preference.

### Path matcher

Because matching by path is so common, a single path matcher can be inlined, like so:

```
redir /old-article.html /new-article.html
```

Path matcher tokens must start with a forward slash `/`.

Note that [path matching](/docs/json/apps/http/servers/routes/match/path/) is an exact match by default; you must append a `*` for a fast prefix match. Be aware that matching `/foo*` will also match `/foobar`; you might actually want `/foo/*` instead.


### Named matcher

Defining a matcher with a unique name gives you more flexibility:

```
@name {
	...
}
```

Then you can use the matcher like so: `@name`

For example:

```
@websockets {
	header_regexp Connection Upgrade
	header        Upgrade websocket
}
reverse_proxy @websockets localhost:6001
```

This example only proxies requests that have a header field named "Connection" containing the word "Upgrade", and another header named "Upgrade" with a value of "websocket".

The following matcher modules are built-in:

```
@name {
	file {
		root <paths>
		try_files <files>
		try_policy first_exist|smallest_size|largest_size|most_recent_modified
    }
	header <field> <value>
	header_regexp <field> <regexp>
	host <hosts...>
	method <methods...>
	not {
		<any other matchers>
	}
	path <paths...>
	path_regexp [<name>] <regexp>
	protocol http|https|grpc
	query <key>=<val>...
	remote_ip <ranges...>
}
```

Like directives, named matcher definitions must go inside the site blocks that use them.


### Matcher examples

This directive applies to all HTTP requests:

```
reverse_proxy localhost:9000
```

As does this:

```
reverse_proxy * localhost:9000
```

But this directive applies only to requests having a path starting with `/api/`:

```
reverse_proxy /api/* localhost:9000
```

To match on anything other than a path, define a **named matcher** and refer to it using `@name`:

```
@post {
	method POST
}
reverse_proxy @post localhost:9000
```



## Placeholders

You can use any [Caddy placeholders](/docs/conventions#placeholders) in the Caddyfile, but for convenience you can also use some equivalent shorthand ones:

| Shorthand       | Replaces                        |
|-----------------|---------------------------------|
| `{dir}`         | `{http.request.uri.path.dir}`   |
| `{file}`        | `{http.request.uri.path.file}`  |
| `{host}`        | `{http.request.host}`           |
| `{hostport}`    | `{http.request.hostport}`       |
| `{method}`      | `{http.request.method}`         |
| `{path}`        | `{http.request.uri.path}`       |
| `{query}`       | `{http.request.uri.query}`      |
| `{remote}`      | `{http.request.remote}`         |
| `{remote_host}` | `{http.request.remote.host}`    |
| `{remote_port}` | `{http.request.remote.port}`    |
| `{scheme}`      | `{http.request.scheme}`         |
| `{uri}`         | `{http.request.uri}`            |



## Snippets

You can define special blocks called snippets by giving them a name surrounded in parentheses:

```
(redirect) {
	@http {
		scheme http
	}
	redir @http https://{host}{uri}
}
```

And then you can reuse this anywhere you need:

```
import redirect
```

The `import` directive can also be used to include other files in its place. As a special case, it can appear almost anywhere within the Caddyfile.



## Comments

Comments start with `#` and proceed until the end of the line:

```
# Comments can start a line
directive  # or go at the end
```


## Environment variables

If your configuration relies on environment variables, you can use them in the Caddyfile:

```
{$SITE_ADDRESS}
```

Environment variables in this form are substituted before parsing begins, so they can expand to empty values, partial tokens, complete tokens, or even multiple tokens and lines.

If you want to defer the substitution of an environment variable until runtime, you can use the [standard `{env.*}` placeholders](/docs/conventions#placeholders).


## Global options

A Caddyfile may optionally start with a special block that has no keys, called a [global options block](/docs/caddyfile/options):

```
{
	...
}
```

If present, it must be the very first block in the config.

It is used to set options that apply globally, or not to any one site in particular. Inside, only global options can be set; you cannot use regular site directives in them.

[Learn more](/docs/caddyfile/options) about the global options block.