---
title: Caddyfile Tutorial
---

# Caddyfile Tutorial

This tutorial will teach you the basics of the [HTTP Caddyfile](/docs/caddyfile) so that you can quickly and easily produce good-looking, functional site configs.

**Objectives:**
- 🔲 First site
- 🔲 Static file server
- 🔲 Templates
- 🔲 Compression
- 🔲 Multiple sites
- 🔲 Matchers
- 🔲 Environment variables
- 🔲 Comments

**Prerequisites:**
- Basic terminal / command line skills
- Basic text editor skills
- `caddy` in your PATH

---

Create a new text file named `Caddyfile` (no extension).

The first thing you should type is your site's [address](/docs/caddyfile/concepts#addresses):

```
localhost
```

Then hit enter and type what you want it to do. For this tutorial, make your Caddyfile look like this:

```
localhost

respond "Hello, world!"
```

Save that and run Caddy:

<pre><code class="cmd bash">caddy run</code></pre>


<aside class="complete">✅ First site</aside>

Open [localhost:2015](http://localhost:2015) in your browser and see your web server working!

Why 2015? Caddy's default port is 2015. Since Caddy cannot activate [automatic HTTPS](/docs/automatic-https) with a hostname like "localhost", it leaves the port unchanged.

Stop Caddy by pressing Ctrl+C in your terminal.

That's not particularly exciting, so let's change our static response to a [file server](/docs/caddyfile/directives/file_server) with directory listings enabled:

```
localhost

file_server browse
```

Save your Caddyfile and run Caddy again. Then refresh your browser tab. You should either see a list of files or an HTML page if there is an index file in the current directory.

<aside class="complete">✅ Static file server</aside>

## Adding functionality

Let's do something interesting with our file server: serve a templated page. Create a new file and paste this into it:

```html
<!DOCTYPE html>
<html>
	<head>
		<title>Caddy tutorial</title>
	</head>
	<body>
		Page loaded at: {<!-- -->{now | date "Mon Jan 2 15:04:05 MST 2006"}<!-- -->}
	</body>
</html>
```

Save this as `caddy.html` in the current directory and load it in your browser: [http://localhost:2015/caddy.html](http://localhost:2015/caddy.html)

The output is:

```
Page loaded at: {<!-- -->{now | date "Mon Jan 2 15:04:05 MST 2006"}<!-- -->}
```

Wait a minute. We should see today's date. Why didn't it work? It's because the server hasn't yet been configured to evaluate templates! Easy to fix, just add a line to the Caddyfile so it looks like this:

```
localhost

templates
file_server browse
```

<aside class="tip">You can also reload Caddy's config without downtime (i.e. without stopping it and starting it again) using the <a href="/docs/command-line#caddy-reload"><code>caddy reload</code></a> command.</aside>

Save that, then restart Caddy, then reload the browser tab. You should see:

```
Page loaded at: {{now | date "Mon Jan 2 15:04:05 MST 2006"}}
```

With Caddy's [templates module](/docs/json/apps/http/servers/errors/routes/handle/templates/), you can do a lot of useful things with static files, such as including other HTML files, making sub-requests, setting response headers, working with data structures, and more!

<aside class="complete">✅ Templates</aside>

It's good practice to compress responses with a quick and modern compression algorithm. Let's enable compression using Gzip and Zstandard using the [`encode`](/docs/caddyfile/directives/encode) directive:

```
localhost

encode zstd gzip
templates
file_server browse
```

<aside class="complete">✅ Compression</aside>

That's the basic process for getting a semi-advanced, production-ready site up and running!

When you're ready to turn on [automatic HTTPS](/docs/automatic-https), just replace your site's address (`localhost` in our tutorial) with your domain name. See our [HTTPS quick-start guide](/docs/quick-starts/https) for more information.

## Multiple sites

With our current Caddyfile, we can only have the one site definition! Only the first line can be the address(es) of the site, and then all the rest of the file has to be directives for that site.

But it is easy to make it so we can add more sites!

Our Caddyfile so far:

```
localhost

encode zstd gzip
templates
file_server browse
```

is equivalent to this one:

```
localhost {
	encode zstd gzip
	templates
	file_server browse
}
```

except the second one allows us to add more sites.

By wrapping our site block in curly braces `{ }` we are able to define multiple, different sites in the same Caddyfile.

For example:

```
:8080 {
	respond "I am 8080"
}

:8081 {
	respond "I am 8081"
}
```

When wrapping site blocks in curly braces, only [addresses](/docs/caddyfile/concepts#addresses) appear outside the curly braces and only [directives](/docs/caddyfile/directives) appear inside them.

For multiple sites which share the same configuration, you can add more addresses, for example:

```
:8080, :8081 {
	...
}
```

You can then define as many different sites as you want, as long as each address is unique.

<aside class="complete">✅ Multiple sites</aside>


## Matchers

We may want to apply some directives only to certain requests. For example, let's suppose we want to have both a file server and a reverse proxy, but we obviously can't do both on every request! Either the file server will write a static file, or the reverse proxy will proxy the request to a backend.

This config will not work like we want:

```
localhost

file_server
reverse_proxy 127.0.0.1:9005
```

In practice, we may want to use the reverse proxy only for API requests, i.e. requests with a base path of `/api/`. This is easy to do, by adding a matcher token:

```
localhost

file_server
reverse_proxy /api/* 127.0.0.1:9005
```

There; now the reverse proxy will be prioritized for all requests starting with `/api/`.

The `/api/*` token we just added is called a **matcher token**. You can tell it's a matcher token because it starts with a forward slash `/` and it appears right after the directive (but you can always look it up in the [directive's docs](/docs/caddyfile/directives) to be sure).

Matchers are actually really powerful. You can name matchers and use them like `@name` to match on more than just the request path! Take a moment to [learn more about matchers](/docs/caddyfile/concepts#matchers) before continuing!

<aside class="complete">✅ Matchers</aside>

## Environment variables

The Caddyfile adapter allows substituting [environment variables](/docs/caddyfile/concepts#environment-variables) before the Caddyfile is parsed.

First, set an environment variable (in the same shell that runs Caddy):

<pre><code class="cmd bash">export SITE_ADDRESS=localhost:9055</code></pre>

Then you can use it like this in the Caddyfile:

```
{$SITE_ADDRESS}

file_server
```

Before the Caddyfile is parsed, it will be expanded to:

```
localhost:9055

file_server
```

You can use environment variables anywhere in the Caddyfile, for any number of tokens.

<aside class="complete">✅ Environment variables</aside>


## Comments

One last thing that you will find most helpful: if you want to remark or note anything in your Caddyfile, you can use comments, starting with `#`:

```
# this starts a comment
```

<aside class="complete">✅ Comments</aside>

## Further reading

- [Caddyfile concepts](/docs/caddyfile/concepts)
- [Directives](/docs/caddyfile/directives)