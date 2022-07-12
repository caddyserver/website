---
title: HTTPS quick-start
---

# HTTPS quick-start

This guide will show you how to get up and running with [fully-managed HTTPS](/docs/automatic-https) in no time.

<aside class="tip">
	Caddy uses HTTPS for all sites by default, as long as a host name is provided in the config. This tutorial assumes you want to get a publicly-trusted site (i.e. not "localhost") up over HTTPS, so we'll be using a public domain name and external ports.
</aside>

**Prerequisites:**
- Basic terminal / command line skills
- Basic understanding of DNS
- A registered public domain name
- External access to ports 80 and 443
- `caddy` and `curl` in your PATH

---

In this tutorial, replace `example.com` with your actual domain name.

Set your domain's A/AAAA records point to your server. You can do this by logging into your DNS provider and managing your domain name.

Before continuing, verify correct records with an authoritative lookup. Replace `example.com` with your domain name, and if you are using IPv6 replace `type=A` with `type=AAAA`:

<pre><code class="cmd bash">curl "https://cloudflare-dns.com/dns-query?name=example.com&type=A" \
  -H "accept: application/dns-json"</code></pre>

Also make sure your server is externally reachable on ports 80 and 443 from a public interface.

<aside class="tip">
	If you're on your home or other restricted network, you may need to forward ports or adjust firewall settings.
</aside>

All we have to do is start Caddy with your domain name in the config. There are several ways to do this.

## Caddyfile

This is the most common way to get HTTPS.

Create a file called `Caddyfile` (no extension) where the first line is your domain name, for example:

```caddy
example.com

respond "Hello, privacy!"
```

Then from the same directory, run:

<pre><code class="cmd bash">caddy run</code></pre>

You will see Caddy provision a TLS certificate and serve your site over HTTPS. This was possible because your site's address in the Caddyfile contained a domain name.


## The `file-server` command

If all you need is serving static files over HTTPS, run this command (replacing your domain name):

<pre><code class="cmd bash">caddy file-server --domain example.com</code></pre>

You will see Caddy provision a TLS certificate and serve your site over HTTPS.


## The `reverse-proxy` command

If all you need is a simple reverse proxy over HTTPS (as a TLS terminator), run this command (replacing your domain name and actual backend address):

<pre><code class="cmd bash">caddy reverse-proxy --from example.com --to localhost:9000</code></pre>

You will see Caddy provision a TLS certificate and serve your site over HTTPS.


## JSON config

The general rule of thumb is that any [host matcher](/docs/json/apps/http/servers/routes/match/host/) will trigger automatic HTTPS.

Thus, a JSON config such as the following will enable production-ready [automatic HTTPS](/docs/automatic-https):

```json
{
	"apps": {
		"http": {
			"servers": {
				"hello": {
					"listen": [":443"],
					"routes": [
						{
							"match": [{
								"host": ["example.com"]
							}],
							"handle": [{
								"handler": "static_response",
								"body": "Hello, privacy!"
							}]
						}
					]
				}
			}
		}
	}
}
```
