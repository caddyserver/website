---
title: Reverse proxy quick-start
---

# Reverse proxy quick-start

This guide will show you how to get a production-ready reverse proxy up and running quickly.

**Prerequisites:**
- Basic terminal / command line skills
- `caddy` in your PATH
- A running backend process to proxy to

---

There are two easy ways to get a quick reverse proxy up and running. We'll show you two equivalent ways to do the same thing.

This tutorial assumes you have a backend HTTP service running on `127.0.0.1:9000`.


## Command line

In your terminal, run this command:

<pre><code class="cmd bash">caddy reverse-proxy --to 127.0.0.1:9000</code></pre>

If you don't have permission to bind to low ports, you can proxy from a higher port:

<pre><code class="cmd bash">caddy reverse-proxy --from :2016 --to 127.0.0.1:9000</code></pre>

Then make a request to [localhost](https://localhost) (or whatever address you specified in `--from`) to see it working!



## Caddyfile

In the current working directory, create a file called `Caddyfile` with these contents:

```caddy
localhost

reverse_proxy 127.0.0.1:9000
```

Then, from the same directory, run:

<pre><code class="cmd bash">caddy run</code></pre>

You can then make a request to [https://localhost](https://localhost) to see it working!

It's easy to change the proxy's address:

```caddy
:2016

reverse_proxy 127.0.0.1:9000
```

Make sure to [reload](/docs/command-line#caddy-reload) Caddy (or stop and start it again) when you change the Caddyfile.

Now you can access the proxy at [localhost:2016](http://localhost:2016).

There is a lot more you can do with the [`reverse_proxy` directive](/docs/caddyfile/directives/reverse_proxy).