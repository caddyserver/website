---
title: "Automatic HTTPS"
---

# Automatic HTTPS

**Caddy is the first and only web server to use HTTPS automatically _and by default_.**

Automatic HTTPS provisions TLS certificates for all your sites and keeps them renewed. It also redirects HTTP to HTTPS for you! Caddy uses safe and modern defaults -- no downtime or extra configuration required.

<aside class="tip">Caddy innovated automatic HTTPS technology; we've been doing this since the first day it was possible in 2015. Caddy's HTTPS automation logic is the most mature and robust in the world.</aside>

Here's a 28-second video showing how it works:

<iframe width="100%" height="480" src="https://www.youtube-nocookie.com/embed/nk4EWHvvZtI?rel=0" frameborder="0" allowfullscreen=""></iframe>



## Overview

**Caddy serves all sites over HTTPS by default.**

- Caddy serves IP addresses and local/internal hostnames over HTTPS with locally-trusted certificates. Examples: `localhost`, `127.0.0.1`.
- Caddy serves public DNS names over HTTPS with certificates from [Let's Encrypt](https://letsencrypt.org). Examples: `example.com`, `sub.example.com`, `*.example.com`.

Caddy keeps all certificates renewed, and redirects HTTP (default port 80) to HTTPS (default port 443) automatically, provided that [activation](/docs/automatic-https#activation) is successful.

**For local HTTPS:**

- Caddy may prompt for a password to install its root certificate into your trust store. This happens only once per root.
- Any client accessing the site without trusting the root cert will show security errors.

**For public domain names:**

<aside class="tip">These are common requirements for any basic production website, not just Caddy. The main difference is to set your DNS records properly <b>before</b> running Caddy.</aside>


- If your domain's A/AAAA records point to your server,
- ports 80 and 443 are open externally,
- Caddy can bind to those ports (_or_ those ports are forwarded to Caddy),
- your `$HOME` folder is writeable and persistent,
- and your domain name appears somewhere relevant in the config,

then sites will be served over HTTPS automatically and without problems. You won't have to know or do anything else about it. It should "just work"!

If you are still testing your setup, however, please read on or you risk being rate limited by your CA. The rest of this page goes over the details for advanced use cases and troubleshooting purposes.



## Activation

Caddy implicitly activates automatic HTTPS when it knows a domain name (i.e. hostname) it is serving. Depending on how you run or configure Caddy, there are various ways to tell Caddy which domain names to use:

- A [site address](/docs/caddyfile/concepts#addresses) in the [Caddyfile](/docs/caddyfile)
- A [host matcher](/docs/json/apps/http/servers/routes/match/host/) in a [route](/docs/modules/http#servers/routes)
- Command line flags like [--domain](/docs/command-line#caddy-file-server) or [--from](/docs/command-line#caddy-reverse-proxy)
- The [automate](/docs/json/apps/tls/certificates/automate/) certificate loader

Any of the following will prevent automatic HTTPS from being activated, either in whole or in part:

- [Explicitly disabling it](/docs/json/apps/http/servers/automatic_https/)
- Not providing any hostnames or IP addresses in the config
- Listening exclusively on the HTTP port
- Manually loading certificates (unless [this config property](/docs/json/apps/http/servers/automatic_https/ignore_loaded_certificates/) is true)


## Effects

When automatic HTTPS is activated, the following occurs:

- Certificates are obtained and renewed for [all domain names](#hostname-requirements)
- The default port (if any) is changed to the [HTTPS port](/docs/modules/http#https_port) 443
- HTTP is redirected to HTTPS (this uses [HTTP port](/docs/modules/http#http_port) 80)

Automatic HTTPS never overrides explicit configuration.

You can [customize or disable automatic HTTPS](/docs/json/apps/http/servers/automatic_https/) if necessary.

<aside class="tip">Disabling redirects keeps the HTTPS port enabled as the default port implicitly assigned to an address. The HTTP port is only bound for redirects and for the ACME HTTP challenge. If you need to serve over HTTP, you must explicitly configure Caddy to do it. [See the examples](/docs/automatic-https#examples).</aside>


## Hostname requirements

All hostnames (domain names and IP addresses) qualify for fully-managed certificates if they:

- are non-empty
- consist only of alphanumerics, hyphens, dots, and wildcard (`*`)
- do not start or end with a dot ([RFC 1034](https://tools.ietf.org/html/rfc1034#section-3.5))

In addition, hostnames qualify for publicly-trusted certificates if they:

- are not localhost
- are not an IP address
- have only a single wildcard `*` as the left-most label



## Local HTTPS

To serve non-public sites over HTTPS, Caddy generates its own certificate authority (CA) and uses it to sign certificates. The trust chain consists of a root and intermediate certificate. Leaf certificates are signed by the intermediate.

Caddy's local CA is powered by [Smallstep libraries](https://smallstep.com/certificates/).

Local HTTPS does not use ACME nor does it perform any DNS validation. It works only on the local machine and is trusted only where the CA's root certificate is installed.

### CA Root

The root's private key is uniquely generated using a cryptographically-secure pseudorandom source and persisted to storage with limited permissions. It is loaded into memory only to perform signing tasks, after which it leaves scope to be garbage-collected.

Although Caddy can be configured to sign with the root directly (to support non-compliant clients), this is disabled by default, and the root key is only used to sign intermediates.

The first time a root key is used, Caddy will try to install it into the system's local trust store(s). If it does not have permission to do so, it will prompt for a password. This behavior can be disabled in the configuration if it is not desired.

<aside class="tip">It is safe to trust Caddy's root certificate on your own machine as long as your computer is not compromised and your unique root key is not leaked.</aside>

After Caddy's root CA is installed, you will see it in your local trust store as "Caddy Local Authority" (unless you've configured a different name). You can uninstall it any time if you wish (the [`caddy untrust`](/docs/command-line#caddy-untrust) command makes this easy).


### CA Intermediates

An intermediate certificate and key will also be generated, which will be used for signing leaf (individual site) certificates.

Unlike the root certificate, intermediate certificates have a much shorter lifetime and will automatically be renewed as needed.





## Testing

To test or experiment with your Caddy configuration, make sure you [change the ACME endpoint](/docs/modules/tls.issuance.acme#ca) to a staging or development URL, otherwise you are likely to hit rate limits which can block your access to HTTPS for up to a week, depending on which rate limit you hit.

Caddy's default CA is [Let's Encrypt](https://letsencrypt.org/), which has a [staging endpoint](https://letsencrypt.org/docs/staging-environment/) that is not subject to the same [rate limits](https://letsencrypt.org/docs/rate-limits/):

```
https://acme-staging-v02.api.letsencrypt.org/directory
```


## ACME challenges

Obtaining a publicly-trusted TLS certificate requires validation from a publicly-trusted, third-party authority. These days, this validation process is automated with the [ACME protocol](https://tools.ietf.org/html/rfc8555), and can be performed one of three ways ("challenge types"), described below.

The first two challenge types are enabled by default. If multiple challenges are enabled, Caddy chooses one at random to avoid accidental dependence on a particular challenge.


### HTTP challenge

The HTTP challenge performs an authoritative DNS lookup for the candidate hostname's A/AAAA record, then requests a temporary cryptographic resource over port 80 using HTTP. If the CA sees the expected resource, a certificate is issued.

This challenge requires port 80 to be externally accessible. If Caddy cannot listen on port 80, packets from port 80 must be forwarded to Caddy's [HTTP port](/docs/json/apps/http/http_port/).

This challenge is enabled by default and does not require explicit configuration.


### TLS-ALPN challenge

The TLS-ALPN challenge performs an authoritative DNS lookup for the candidate hostname's A/AAAA record, then requests a temporary cryptographic resource over port 443 using a TLS handshake containing special ServerName and ALPN values. If the CA sees the expected resource, a certificate is issued.

This challenge requires port 443 to be externally accessible. If Caddy cannot listen on port 443, packets from port 443 must be forwarded to Caddy's [HTTPS port](/docs/json/apps/http/https_port/).

This challenge is enabled by default and does not require explicit configuration.


### DNS challenge

The DNS challenge performs an authoritative DNS lookup for the candidate hostname's TXT records, and looks for a special TXT record with a certain value. If the CA sees the expected value, a certificate is issued.

This challenge does not require any open ports, and the server requesting a certificate does not need to be externally accessible. However, the DNS challenge requires configuration. Caddy needs to know the credentials to access your domain's DNS provider so it can set (and clear) the special TXT records. If the DNS challenge is enabled, other challenges are disabled by default.

DNS provider support is a community effort. [Learn how to enable the DNS challenge for your provider at our wiki.](https://caddy.community/t/how-to-use-dns-provider-modules-in-caddy-2/8148)


## On-Demand TLS

Caddy pioneered a new technology we call On-Demand TLS, which obtains the certificate for a name during the first TLS handshake that requires it, rather than at config load. You can enable it using the [on_demand](/docs/json/apps/tls/automation/on_demand/) property in your TLS automation config, or the [on_demand Caddyfile subdirective](/docs/caddyfile/directives/tls#syntax).

This feature can be useful if you do not know all the domain names up front, or if domain names you know of may not be properly configured right away (e.g. DNS records not yet set correctly). Certificates managed on-demand will be obtained and renewed in the foreground of TLS handshakes that require it. This process slows down only the initial TLS handshake; all others will not be affected.

To prevent abuse, you should specify rate limits and/or an endpoint that Caddy can query to ask if a certificate is allowed to be obtained for a hostname. Essentially, you still need a way to provide a whitelist, but this can be managed dynamically using your own scripts or programs if you'd rather keep Caddy's config more static.

**Future support:** This feature relies on the CA issuing certificates without delay. If instantaneous issuance becomes uncommon among ACME CAs, we may discontinue this feature in Caddy.

Due to its deferred nature and the possibility that some ACME challenges can take more than a few seconds (especially when using the DNS challenge), we typically recommend using On-Demand TLS only when there are specific technical or operational advantages to you; namely, if the DNS records for a domain are not in your control, and you do not know when they will be properly set and ready to get certificates.


## Errors

Caddy does its best to continue if errors occur with certificate management.

By default, certificate management is performed in the background. This means it will not block startup or slow down your sites. However, it also means that the server will be running even before all certificates are available. Running in the background allows Caddy to retry with exponential backoff over a long period of time.

Here's what happens if there's an error obtaining or renewing a certificate:

1. Caddy retries once after a brief pause just in case it was a fluke
2. Caddy pauses briefly, then switches to the next enabled challenge type
3. After all enabled challenge types have been tried, it backs off exponentially
	- Maximum of 1 day between attempts
	- For up to 30 days

During retries with Let's Encrypt, Caddy switches to their [staging environment](https://letsencrypt.org/docs/staging-environment/) to avoid rate limit concerns. This isn't a perfect strategy, but in general it's helpful.

ACME challenges take at least a few seconds, and internal rate limiting helps mitigate accidental abuse. Caddy uses internal rate limiting in addition to what you or the CA configure so that you can hand Caddy a platter with a million domain names and it will gradually -- but as fast as it can -- obtain certificates for all of them.

Caddy's internal rate limit is currently 10 attempts per ACME account per minute.


## Storage

Caddy will store public certificates, private keys, and other assets in its [configured storage facility](/docs/json/storage/) (or the default one, if not configured -- see link for details).

**The main thing you need to know is that the `$HOME` folder must be writeable and persistent.**

Any Caddy instances that are configured to use the same storage will automatically share those resources and coordinate certificate management as a cluster.

Before attempting any ACME transactions, Caddy will test the configured storage to ensure it is writeable and has sufficient capacity. This helps reduce unnecessary rate limit contention.



## Wildcard certificates

Caddy can obtain and manage wildcard certificates when it is configured to serve a site with a qualifying wildcard name. A site name qualifies for a wildcard if only its left-most domain label is a wildcard. For example, `*.example.com` qualifies, but these do not: `sub.*.example.com`, `foo*.example.com`, `*bar.example.com`, and `*.*.example.com`.

To get a wildcard from Let's Encrypt, you simply need to enable the [DNS challenge](#dns-challenge) and use a wildcard domain in your config. We recommend using wildcards only when you have so many subdomains that you would encounter CA rate limits trying to obtain certificates for them all.



## Examples

Caddy implicitly uses the HTTPS port (default 443) for your [site addresses](/docs/conventions#network-addresses) that don't specify a port explicitly (which would disable automatic HTTPS). 

Automatic HTTPS can be configured via the Caddyfile with the [`auto_https` global option](/docs/caddyfile/options), or via [per-server JSON configuration](/docs/json/apps/http/servers/automatic_https/). The Caddyfile option can be set to either of the following:
- `disable_redirects` which disables the implicit HTTP->HTTPS redirect.
- `off` which disables automatic HTTPS altogether, including the HTTP->HTTPS redirect and automatic enabling of TLS for sites that meet the requirements.

| auto_https        | HTTP        | HTTPS       |
|-------------------|-------------|-------------|
| *default*         | redirects   | connects    |
| disable_redirects | unreachable | connects    |
| off               | connects    | unreachable |

`unreachable` is the default without additional configuration when using the related `auto_https` setting.
`connects` is the implicitly assigned port.


### Disabling automatic HTTPS

For local development environments, you can prevent serving via HTTPS by either specifying `http://` or providing a non-HTTPS port to disable per site, or by adding `auto_https off` to the Caddyfile global options which will change Caddy's implicit port to be the HTTP port (default 80).

Have caddy implicitly use the HTTP port:

```caddy
{
	auto_https off
}

localhost {
	root * /usr/share/caddy

	file_server
}
```

Alternatively, provide an explicit port:

```caddy
localhost:9000 {
	root * /usr/share/caddy

	file_server
}
```


### HTTP and HTTPS without redirect

If you wish to serve content through both HTTP and HTTPS, without HTTP->HTTPS redirects, your site address must explicitly declare the intent to listen on both ports. To do so, [specify multiple site labels](/docs/caddyfile/concepts#addresses), separated by a comma or whitespace.

HTTP and HTTPS by protocol, default ports can be configured via the Caddyfile [`http_port` and `https_port` global options](/docs/caddyfile/options):

```caddy
{
	auto_https disable_redirects
}

http://localhost, https://localhost {
	root * /usr/share/caddy

	file_server
}
```

Alternatively specify the ports explicitly:

```caddy
{
	auto_https disable_redirects
}

localhost:80, localhost:443 {
	root * /usr/share/caddy

	file_server
}
```
