---
title: File server quick-start
---

# File server quick-start

This guide will show you how to get a production-ready static file server up and running quickly.

**Prerequisites:**
- Basic terminal / command line skills
- `caddy` in your PATH
- A folder containing your website

---

There are two easy ways to get a quick file server up and running. We'll show you two equivalent ways to do the same thing.

## Command line

In your terminal, change to the root directory of your site and run:

<pre><code class="cmd bash">caddy file-server</code></pre>

The default address is :2015, so load [localhost:2015](http://localhost:2015) in your browser to see your site!

If you don't have an index file but you want to display a file listing, use the `--browse` option:

<pre><code class="cmd bash">caddy file-server --browse</code></pre>

You can also listen on port 80 easily enough:

<pre><code class="cmd bash">caddy file-server --listen :80</code></pre>

Or set use another folder as the site root:

<pre><code class="cmd bash">caddy file-server --root ~/mysite</code></pre>



## Caddyfile

In the root of your site, create a file called `Caddyfile` with these contents:

```
localhost

file_server
```

Then, from the same directory, run:

<pre><code class="cmd bash">caddy run</code></pre>

You can then load [localhost:2015](http://localhost:2015) to see your site!

The [`file_server` directive](/docs/caddyfile/directives/file_server) has more options for you to customize your site. Make sure to [reload](/docs/command-line#caddy-reload) Caddy (or stop and start it again) when you change the Caddyfile!

If you don't have an index file but you want to display a file listing, use the `browse` argument:

```
localhost

file_server browse
```

You can also listen on port 80 easily enough:

```
:80

file_server
```

Or set use another folder as the site root:

```
localhost

root /home/me/mysite
file_server
```

