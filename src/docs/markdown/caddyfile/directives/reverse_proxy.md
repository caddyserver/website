---
title: reverse_proxy (Caddyfile directive)
---

<script>
$(function() {
	// Fix response matchers to render with the right color,
	// and link to response matchers section
	$('pre.chroma .k:contains("@")')
		.map(function(k, item) {
			let text = item.innerText.replace(/</g,'&lt;').replace(/>/g,'&gt;');
			let url = '#' + item.innerText.replace(/_/g, "-");
			$(item).addClass('nd').removeClass('k')
			$(item).html('<a href="#response-matcher" style="color: inherit;" title="Response matcher">' + text + '</a>');
		});

	// Fix matcher placeholder
	$('pre.chroma .k:contains("handle_response")').first().nextAll().slice(0, 3)
		.wrapAll('<span class="nd">').parent()
		.html('<a href="#response-matcher" style="color: inherit;" title="Response matcher">[&lt;matcher&gt;]</a>')

	// We'll add links to all the subdirectives if a matching anchor tag is found on the page.
	addLinksToSubdirectives();
});
</script>

# reverse_proxy

Proxies requests to one or more backends with configurable transport, load balancing, health checking, request manipulation, and buffering options.

- [Syntax](#syntax)
- [Upstreams](#upstreams)
  - [Upstream addresses](#upstream-addresses)
  - [Dynamic upstreams](#dynamic-upstreams)
    - [SRV](#srv)
    - [A/AAAA](#aaaaa)
	- [Multi](#multi)
- [Load balancing](#load-balancing)
  - [Active health checks](#active-health-checks)
  - [Passive health checks](#passive-health-checks)
- [Streaming](#streaming)
- [Headers](#headers)
- [Rewrites](#rewrites)
- [Transports](#transports)
  - [The `http` transport](#the-http-transport)
  - [The `fastcgi` transport](#the-fastcgi-transport)
- [Intercepting responses](#intercepting-responses)
- [Examples](#examples)



## Syntax

```caddy-d
reverse_proxy [<matcher>] [<upstreams...>] {
	# backends
	to      <upstreams...>
	dynamic <module> ...

	# load balancing
	lb_policy       <name> [<options...>]
	lb_retries      <retries>
	lb_try_duration <duration>
	lb_try_interval <interval>
	lb_retry_match  <request-matcher>

	# active health checking
	health_uri      <uri>
	health_port     <port>
	health_interval <interval>
	health_timeout  <duration>
	health_status   <status>
	health_body     <regexp>
	health_headers {
		<field> [<values...>]
	}

	# passive health checking
	fail_duration     <duration>
	max_fails         <num>
	unhealthy_status  <status>
	unhealthy_latency <duration>
	unhealthy_request_count <num>

	# streaming
	flush_interval <duration>
	request_buffers <size>
	response_buffers <size>

	# request/header manipulation
	trusted_proxies [private_ranges] <ranges...>
	header_up   [+|-]<field> [<value|regexp> [<replacement>]]
	header_down [+|-]<field> [<value|regexp> [<replacement>]]
	method <method>
	rewrite <to>

	# round trip
	transport <name> {
		...
	}

	# optionally intercept responses from upstream
	@name {
		status <code...>
		header <field> [<value>]
	}
	replace_status [<matcher>] <status_code>
	handle_response [<matcher>] {
		<directives...>

		# special directives only available in handle_response
		copy_response [<matcher>] [<status>] {
			status <status>
		}
		copy_response_headers [<matcher>] {
			include <fields...>
			exclude <fields...>
		}
	}
}
```



### Upstreams

- **&lt;upstreams...&gt;** is a list of upstreams (backends) to which to proxy.
- **to** <span id="to"/> is an alternate way to specify the list of upstreams, one (or more) per line.
- **dynamic** <span id="dynamic"/> configures a _dynamic upstreams_ module. This allows getting the list of upstreams dynamically for every request. See [dynamic upstreams](#dynamic-upstreams) below for a description of standard dynamic upstream modules. Dynamic upstreams are retrieved at every proxy loop iteration (i.e. potentially multiple times per request if load balancing retries are enabled) and will be preferred over static upstreams. If an error occurs, the proxy will fall back to using any statically-configured upstreams.


#### Upstream addresses

Static upstream addresses can take the form of a URL that contains only scheme and host/port, or a conventional [Caddy network address](/docs/conventions#network-addresses). Valid examples:

- `localhost:4000`
- `127.0.0.1:4000`
- `http://localhost:4000`
- `https://example.com`
- `h2c://127.0.0.1`
- `example.com`
- `unix//var/php.sock`
- `unix+h2c//var/grpc.sock`
- `localhost:8001-8006`

By default, connections are made to the upstream over plaintext HTTP. When using the URL form, a scheme can be used to set some [`transport`](#transports) defaults as a shorthand.
- Using `https://` as the scheme will use the [`http` transport](#the-http-transport) with [`tls`](#tls) enabled.

  Additionally, you may need to override the `Host` header such that it matches the TLS SNI value, which is used by servers for routing and certificate selection. See the [HTTPS](#https) section below for more details.

- Using `h2c://` as the scheme will use the [`http` transport](#the-http-transport) with [HTTP versions](#versions) set to allow cleartext HTTP/2 connections.
- Using `http://` as the scheme is identical to having omitted the scheme, since HTTP is already the default. This syntax is included for symmetry with the other scheme shortcuts.

Schemes cannot be mixed, since they modify the common transport configuration (a TLS-enabled transport cannot carry both HTTPS and plaintext HTTP). Any explicit transport configuration will not be overwritten, and omitting schemes or using other ports will not assume a particular transport.

When using the [network address](/docs/conventions#network-addresses) form, the network type is specified as a prefix to the upstream address. This cannot be combined with a URL scheme. As a special case, `unix+h2c/` is supported as a shortcut for the `unix/` network plus the same effects as the `h2c://` scheme. Port ranges are supported as a shortcut, which expands to multiple upstreams with the same host.

Upstream addresses _cannot_ contain paths or query strings, as that would imply simultaneous rewriting the request while proxying, which behavior is not defined or supported. You may use the [`rewrite`](/docs/caddyfile/directives/rewrite) directive should you need this.

If the address is not a URL (i.e. does not have a scheme), then placeholders can be used, but this makes the upstream _dynamically static_, meaning that potentially many different backends act as a single, static upstream in terms of health checks and load balancing. We recommend using a [dynamic upstreams](#dynamic-upstreams) module instead, if possible.


#### Dynamic upstreams

Caddy's reverse proxy comes standard with some dynamic upstream modules. Note that using dynamic upstreams has implications for load balancing and health checks, depending on specific policy configuration: active health checks do not run for dynamic upstreams; and load balancing and passive health checks are best served if the list of upstreams is relatively stable and consistent (especially with round-robin). Ideally, dynamic upstream modules only return healthy, usable backends.


##### SRV

Retrieves upstreams from SRV DNS records.

```caddy-d
	dynamic srv [<full_name>] {
		service   <service>
		proto     <proto>
		name      <name>
		refresh   <interval>
		resolvers <ip...>
		dial_timeout        <duration>
		dial_fallback_delay <duration>
	}
```

- **&lt;full_name&gt;** is the full domain name of the record to look up (i.e. `_service._proto.name`).
- **service** is the service component of the full name.
- **proto** is the protocol component of the full name. Either `tcp` or `udp`.
- **name** is the name component. Or, if `service` and `proto` are empty, the full domain name to query.
- **refresh** is how often to refresh cached results. Default: `1m`
- **resolvers** is the list of DNS resolvers to override system resolvers.
- **dial_timeout** is the timeout for dialing the query.
- **dial_fallback_delay** is how long to wait before spawning an RFC 6555 Fast Fallback connection. Default: `300ms`



##### A/AAAA

Retrieves upstreams from A/AAAA DNS records.

```caddy-d
	dynamic a [<name> <port>] {
		name      <name>
		port      <port>
		refresh   <interval>
		resolvers <ip...>
		dial_timeout        <duration>
		dial_fallback_delay <duration>
		versions ipv4|ipv6
	}
```

- **name** is the domain name to query.
- **port** is the port to use for the backend.
- **refresh** is how often to refresh cached results. Default: `1m`
- **resolvers** is the list of DNS resolvers to override system resolvers.
- **dial_timeout** is the timeout for dialing the query.
- **dial_fallback_delay** is how long to wait before spawning an RFC 6555 Fast Fallback connection. Default: `300ms`
- **versions** is the list of IP versions to resolve for. Default: `ipv4 ipv6` which correspond to both A and AAAA records respectively.


##### Multi

Append the results of multiple dynamic upstream modules. Useful if you want redundant sources of upstreams, for example: a primary cluster of SRVs backed up by a secondary cluster of SRVs.

```caddy-d
	dynamic multi {
		<source> [...]
	}
```

- **&lt;source&gt;** is the name of the module for the dynamic upstreams, followed by its configuration. More than one may be specified.




### Load balancing

Load balancing is used whenever more than one upstream is defined.

- **lb_policy** <span id="lb_policy"/> is the name of the load balancing policy, along with any options. Default: `random`.

  For policies that involve hashing, the [highest-random-weight (HRW)](https://en.wikipedia.org/wiki/Rendezvous_hashing) algorithm is used to ensure that a client or request with the same hash key is mapped to the same upstream, even if the list of upstreams change.

  Some policies support fallback as an option, if noted, in which case they take a [block](/docs/caddyfile/concepts#blocks) with `fallback <policy>` which takes another load balancing policy. For those policies, the default fallback is `random`. Configuring a fallback allows using a secondary policy if the primary does not select one, allowing for powerful combinations. Fallbacks can be nested multiple times if desired. For example, `header` can be used as primary to allow for developers to choose a specific upstream, with a fallback of `first` for all other connections to implement primary/secondary failover.

	- `random` randomly chooses an upstream

	- `random_choose <n>` selects two or more upstreams randomly, then chooses one with least load (`n` is usually 2)

	- `first` chooses the first available upstream, from the order they are defined in the config, allowing for primary/secondary failover; remember to enable health checks along with this, otherwise failover will not occur

	- `round_robin` iterates each upstream in turn

	- `least_conn` choose upstream with fewest number of current requests; if more than one host has the least number of requests, then one of those hosts is chosen at random

	- `ip_hash` maps the remote IP (the immediate peer) to a sticky upstream

	- `client_ip_hash` maps the client IP to a sticky upstream; this is best paired with the [`servers > trusted_proxies` global option](/docs/caddyfile/options#trusted-proxies) which enables real client IP parsing, otherwise it behaves the same as `ip_hash`

	- `uri_hash` maps the request URI (path and query) to a sticky upstream

	- `query [key]` maps a request query to a sticky upstream, by hashing the query value; if the specified key is not present, the fallback policy will be used to select an upstream (`random` by default)

	- `header [field]` maps a request header to a sticky upstream, by hashing the header value; if the specified header field is not present, the fallback policy will be used to select an upstream (`random` by default)

	- `cookie [<name> [<secret>]]` on the first request from a client (when there's no cookie), the fallback policy will be used to select an upstream (`random` by default), and a `Set-Cookie` header is added to the response (default cookie name is `lb` if not specified). The cookie value is the upstream dial address of the chosen upstream, hashed with HMAC-SHA256 (using `<secret>` as the shared secret, empty string if not specified).
	
	  On subsequent requests where the cookie is present, the cookie value will be mapped to the same upstream if it's available; if not available or not found, a new upstream is selected with the fallback policy, and the cookie is added to the response.

	  If you wish to use a particular upstream for debugging purposes, you may hash the upstream address with the secret, and set the cookie in your HTTP client (browser or otherwise). For example, with PHP, you could run the following to compute the cookie value, where `10.1.0.10:8080` is the address of one of your upstreams, and `secret` is your configured secret.
	  ```php
	  echo hash_hmac('sha256', '10.1.0.10:8080', 'secret');
	  // cdd96966817dd14a99f47ee17451464f29998da170814a16b483e4c1ff4c48cf
	  ```
	
	  You can set the cookie in your browser via the Javascript console, for example to set the cookie named `lb`:
	  ```js
	  document.cookie = "lb=cdd96966817dd14a99f47ee17451464f29998da170814a16b483e4c1ff4c48cf";
	  ```

- **lb_retries** <span id="lb_retries"/> is how many times to retry selecting available backends for each request if the next available host is down. By default, retries are disabled (zero).

  If [`lb_try_duration`](#lb_try_duration) is also configured, then retries may stop early if the duration is reached. In other words, the retry duration takes precedence over the retry count.

- **lb_try_duration** <span id="lb_try_duration"/> is a [duration value](/docs/conventions#durations) that defines how long to try selecting available backends for each request if the next available host is down. By default, retries are disabled (zero duration).

  Clients will wait for up to this long while the load balancer tries to find an available upstream host. A reasonable starting point might be `5s` since the HTTP transport's default dial timeout is `3s`, so that should allow for at least one retry if the first selected upstream cannot be reached; but feel free to experiment to find the right balance for your usecase.

- **lb_try_interval** <span id="lb_try_interval"/> is a [duration value](/docs/conventions#durations) that defines how long to wait between selecting the next host from the pool. Default is `250ms`. Only relevant when a request to an upstream host fails. Be aware that setting this to `0` with a non-zero `lb_try_duration` can cause the CPU to spin if all backends are down and latency is very low.

- **lb_retry_match** <span id="lb_retry_match"/> restricts with which requests retries are allowed. A request must match this condition in order to be retried if the connection to the upstream succeded but the subsequent round-trip failed. If the connection to the upstream failed, a retry is always allowed. By default, only `GET` requests are retried.

  The syntax for this option is the same as for [named request matchers](/docs/caddyfile/matchers#named-matchers), but without the `@name`. If you only need a single matcher, you may configure it on the same line. For multiple matchers, a block is necessary.



#### Active health checks

Active health checks perform health checking in the background on a timer:

- **health_uri** <span id="health_uri"/> is the URI path (and optional query) for active health checks.

- **health_port** <span id="health_port"/> is the port to use for active health checks, if different from the upstream's port.

- **health_interval** <span id="health_interval"/> is a [duration value](/docs/conventions#durations) that defines how often to perform active health checks.

- **health_timeout** <span id="health_timeout"/> is a [duration value](/docs/conventions#durations) that defines how long to wait for a reply before marking the backend as down.

- **health_status** <span id="health_status"/> is the HTTP status code to expect from a healthy backend. Can be a 3-digit status code, or a status code class ending in `xx`. For example: `200` (which is the default), or `2xx`.

- **health_body** <span id="health_body"/> is a substring or regular expression to match on the response body of an active health check. If the backend does not return a matching body, it will be marked as down.

- **health_headers** <span id="health_headers"/> allows specifying headers to set on the active health check requests. This is useful if you need to change the `Host` header, or if you need to provide some authentication to your backend as part of your health checks.



#### Passive health checks

Passive health checks happen inline with actual proxied requests:

- **fail_duration** <span id="fail_duration"/>  is a [duration value](/docs/conventions#durations) that defines how long to remember a failed request. A duration > `0` enables passive health checking; the default is `0` (off). A reasonable starting point might be `30s` to balance error rates with responsiveness when bringing an unhealthy upstream back online; but feel free to experiment to find the right balance for your usecase.

- **max_fails** <span id="max_fails"/> is the maximum number of failed requests within `fail_duration` that are needed before considering a backend to be down; must be >= `1`; default is `1`.

- **unhealthy_status** <span id="unhealthy_status"/> counts a request as failed if the response comes back with one of these status codes. Can be a 3-digit status code or a status code class ending in `xx`, for example: `404` or `5xx`.

- **unhealthy_latency** <span id="unhealthy_latency"/> is a [duration value](/docs/conventions#durations) that counts a request as failed if it takes this long to get a response.

- **unhealthy_request_count** <span id="unhealthy_request_count"/> is the permissible number of simultaneous requests to a backend before marking it as down. In other words, if a particular backend is currently handling this many requests, then it's considered "overloaded" and other backends will be preferred instead.

  This should be a reasonably large number; configuring this means that the proxy will have a limit of `unhealthy_request_count × upstreams_count` total simultaneous requests, and any requests after that point will result in an error due to no upstreams being available.



### Streaming

By default, the proxy partially buffers the response for wire efficiency:

- **flush_interval** <span id="flush_interval"/> is a [duration value](/docs/conventions#durations) that adjusts how often Caddy should flush the response buffer to the client. By default, no periodic flushing is done. A negative value (typically -1) suggests "low-latency mode" which disables response buffering completely and flushes immediately after each write to the client, and does not cancel the request to the backend even if the client disconnects early. This option is ignored and responses are flushed immediately to the client if one of the following applies from the response:
	- `Content-Type: text/event-stream`
	- `Content-Length` is unknown
	- HTTP/2 on both sides of the proxy, `Content-Length` is unknown, and `Accept-Encoding` is either not set or is "identity"

- **request_buffers** <span id="request_buffers"/> will cause the proxy to read up to `<size>` amount of bytes from the request body into a buffer before sending it upstream. This is very inefficient and should only be done if the upstream requires reading request bodies without delay (which is something the upstream application should fix). This accepts all size formats supported by [go-humanize](https://github.com/dustin/go-humanize/blob/master/bytes.go).

- **response_buffers** <span id="response_buffers"/> will cause the proxy to read up to `<size>` amount of bytes from the response body to be read into a buffer before being returned to the client. This should be avoided if at all possible for performance reasons, but could be useful if the backend has tighter memory constraints. This accepts all size formats supported by [go-humanize](https://github.com/dustin/go-humanize/blob/master/bytes.go).



### Headers

The proxy can **manipulate headers** between itself and the backend:

- **header_up** <span id="header_up"/> sets, adds (with the `+` prefix), deletes (with the `-` prefix), or performs a replacement (by using two arguments, a search and replacement) in a request header going upstream to the backend.

- **header_down** <span id="header_down"/> sets, adds (with the `+` prefix), deletes (with the `-` prefix), or performs a replacement (by using two arguments, a search and replacement) in a response header coming downstream from the backend.

For example, to set a request header, overwriting any existing values:

```caddy-d
header_up Some-Header "the value"
```

To add a response header; note that there can be multiple values for a header field:

```caddy-d
header_down +Some-Header "first value"
header_down +Some-Header "second value"
```

To delete a request header, preventing it from reaching the backend:

```caddy-d
header_up -Some-Header
```

To delete all matching request headers, using a suffix match:

```caddy-d
header_up -Some-*
```

To delete _all_ request headers, to be able to individually add the ones you want (not recommended):

```caddy-d
header_up -*
```

To perform a regular expression replacement on a request header:

```caddy-d
header_up Some-Header "^prefix-([A-Za-z0-9]*)$" "replaced-$1-suffix"
```

The regular expression language used is RE2, included in Go. See the [RE2 syntax reference](https://github.com/google/re2/wiki/Syntax) and the [Go regexp syntax overview](https://pkg.go.dev/regexp/syntax). The replacement string is [expanded](https://pkg.go.dev/regexp#Regexp.Expand), allowing use of captured values, for example `$1` being the first capture group.


#### Defaults

By default, Caddy passes thru incoming headers&mdash;including `Host`&mdash;to the backend without modifications, with three exceptions:

- It sets or augments the [`X-Forwarded-For`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) header field.
- It sets the [`X-Forwarded-Proto`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto) header field.
- It sets the [`X-Forwarded-Host`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Host) header field.

<span id="trusted_proxies"/> For these `X-Forwarded-*` headers, by default, the proxy will ignore their values from incoming requests, to prevent spoofing.

If Caddy is not the first server being connected to by your clients (for example when a CDN is in front of Caddy), you may configure `trusted_proxies` with a list of IP ranges (CIDRs) from which incoming requests are trusted to have sent good values for these headers.

It is strongly recommended that you configure this via the [`servers > trusted_proxies` global option](/docs/caddyfile/options#trusted-proxies) instead of in the proxy, so that this applies to all proxy handlers in your server, and this has the benefit of enabling client IP parsing.

<aside class="tip">

If you're using Cloudflare in front of Caddy, be aware that you may be vulnerable to spoofing of the `X-Forwarded-For` header. Our friends at [Authelia](https://www.authelia.com) have documented a [workaround](https://www.authelia.com/integration/proxies/fowarded-headers/) to configure Cloudflare to ignore incoming values for this header.

</aside>

Additionally, when using the [`http` transport](#the-http-transport), the `Accept-Encoding: gzip` header will be set, if it is missing in the request from the client. This allows the upstream to serve compressed content if it can. This behavior can be disabled with [`compression off`](#compression) on the transport.


#### HTTPS

Since (most) headers retain their original value when being proxied, it is often necessary to override the `Host` header with the configured upstream address when proxying to HTTPS, such that the `Host` header matches the TLS ServerName value. For example:

```caddy-d
reverse_proxy https://example.com {
	header_up Host {upstream_hostport}
}
```



### Rewrites

By default, Caddy performs the upstream request with the same HTTP method and URI as the incoming request, unless a rewrite was performed in the middleware chain before it reaches `reverse_proxy`.

Before proxying it, the request is cloned; this ensures that any modifications done to the request during the handler do not leak to other handlers. This is useful in situations where the handling needs to continue after the proxy.

In addition to [header manipulations](#headers), the request's method and URI may be changed before it is sent to the upstream:

- **method** <span id="method"/> changes the HTTP method of the cloned request. If the method is changed to `GET` or `HEAD`, then the incoming request's body will _not_ be sent upstream by this handler. This is useful if you wish to allow a different handler to consume the request body.
- **rewrite** <span id="rewrite"/> changes the URI (path and query) of the cloned request. This is similar to the [`rewrite` directive](/docs/caddyfile/directives/rewrite), except that it doesn't persist the rewrite past the scope of this handler.

These rewrites are often useful for a pattern like "pre-check requests", where a request is sent to another server to help make a decision on how to continue handling the current request.

For example, the request could be sent to an authentication gateway to decide whether the request was from an authenticated user (e.g. the request has a session cookie) and should continue, or should instead be redirected to a login page. For this pattern, Caddy provides a shortcut directive [`forward_auth`](/docs/caddyfile/directives/forward_auth) to skip most of the config boilerplate.




### Transports

Caddy's proxy **transport** is pluggable:

- **transport** <span id="transport"/> defines how to communicate with the backend. Default is `http`.


#### The `http` transport

```caddy-d
transport http {
	read_buffer             <size>
	write_buffer            <size>
	max_response_header     <size>
	proxy_protocol          v1|v2
	dial_timeout            <duration>
	dial_fallback_delay     <duration>
	response_header_timeout <duration>
	expect_continue_timeout <duration>
	resolvers <ip...>
	tls
	tls_client_auth <automate_name> | <cert_file> <key_file>
	tls_insecure_skip_verify
	tls_timeout <duration>
	tls_trusted_ca_certs <pem_files...>
	tls_server_name <server_name>
	tls_renegotiation <level>
	tls_except_ports <ports...>
	keepalive [off|<duration>]
	keepalive_interval <interval>
	keepalive_idle_conns <max_count>
	keepalive_idle_conns_per_host <count>
	versions <versions...>
	compression off
	max_conns_per_host <count>
}
```

- **read_buffer** <span id="read_buffer"/> is the size of the read buffer in bytes. It accepts all formats supported by [go-humanize](https://github.com/dustin/go-humanize/blob/master/bytes.go). Default: `4KiB`.

- **write_buffer** <span id="write_buffer"/> is the size of the write buffer in bytes. It accepts all formats supported by [go-humanize](https://github.com/dustin/go-humanize/blob/master/bytes.go). Default: `4KiB`.

- **max_response_header** <span id="max_response_header"/> is the maximum amount of bytes to read from response headers. It accepts all formats supported by [go-humanize](https://github.com/dustin/go-humanize/blob/master/bytes.go). Default: `10MiB`.

- **proxy_protocol** <span id="proxy_protocol"/> enables [PROXY protocol](https://www.haproxy.org/download/1.8/doc/proxy-protocol.txt) (popularized by HAProxy) on the connection to the upstream, prepending the real client IP data. This is best paired with the [`servers > trusted_proxies` global option](/docs/caddyfile/options#trusted-proxies) if Caddy is behind another proxy. Versions `v1` and `v2` are supported. This should only be used if you know the upstream server is able to parse PROXY protocol. By default, this is disabled.

- **dial_timeout** <span id="dial_timeout"/> is the maximum [duration](/docs/conventions#durations) to wait when connecting to the upstream socket. Default: `3s`.

- **dial_fallback_delay** <span id="dial_fallback_delay"/> is the maximum [duration](/docs/conventions#durations) to wait before spawning an RFC 6555 Fast Fallback connection. A negative value disables this. Default: `300ms`.

- **response_header_timeout** <span id="response_header_timeout"/> is the maximum [duration](/docs/conventions#durations) to wait for reading response headers from the upstream. Default: No timeout.

- **expect_continue_timeout** <span id="expect_continue_timeout"/> is the maximum [duration](/docs/conventions#durations) to wait for the upstreams's first response headers after fully writing the request headers if the request has the header `Expect: 100-continue`. Default: No timeout.

- **read_timeout** <span id="read_timeout"/> is the maximum [duration](/docs/conventions#durations) to wait for the next read from the backend. Default: No timeout.

- **write_timeout** <span id="write_timeout"/> is the maximum [duration](/docs/conventions#durations) to wait for the next writes to the backend. Default: No timeout.

- **resolvers** <span id="resolvers"/> is a list of DNS resolvers to override system resolvers.

- **tls** <span id="tls"/> uses HTTPS with the backend. This will be enabled automatically if you specify backends using the `https://` scheme or port `:443`, or if any of the below `tls_*` options are configured.

- **tls_client_auth** <span id="tls_client_auth"/> enables TLS client authentication one of two ways: (1) by specifying a domain name for which Caddy should obtain a certificate and keep it renewed, or (2) by specifying a certificate and key file to present for TLS client authentication with the backend.

- **tls_insecure_skip_verify** <span id="tls_insecure_skip_verify"/> turns off TLS handshake verification, making the connection insecure and vulnerable to man-in-the-middle attacks. _Do not use in production._

- **tls_timeout** <span id="tls_timeout"/> is the maximum [duration](/docs/conventions#durations) to wait for the TLS handshake to complete. Default: No timeout.

- **tls_trusted_ca_certs** <span id="tls_trusted_ca_certs"/> is a list of PEM files that specify CA public keys to trust when connecting to the backend.

- **tls_server_name** <span id="tls_server_name"/> sets the server name used when verifying the certificate received in the TLS handshake. By default, this will use the upstream address' host part.

  You only need to override this if your upstream address does not match the certificate the upstream is likely to use. For example if the upstream address is an IP address, then you would need to configure this to the hostname being served by the upstream server.

  A request placeholder may be used, in which case a clone of the HTTP transport config will be used on every request, which may incur a performance penalty.

- **tls_renegotiation** <span id="tls_renegotiation"/> sets the TLS renegotiation level. TLS renegotiation is the act of performing subsequent handshakes after the first. The level may be one of:
  - `never` (the default) disables renegotiation.
  - `once` allows a remote server to request renegotiation once per connection.
  - `freely` allows a remote server to repeatedly request renegotiation.

- **tls_except_ports** <span id="tls_except_ports"/> when TLS is enabled, if the upstream target uses one of the given ports, TLS will be disabled for those connections. This may be useful when configuring dynamic upstreams, where some upstreams expect HTTP and others expect HTTPS requests.

- **keepalive** <span id="keepalive"/> is either `off` or a [duration value](/docs/conventions#durations) that specifies how long to keep connections open (timeout). Default: `2m`.

- **keepalive_interval** <span id="keepalive"/> is the [duration](/docs/conventions#durations) between liveness probes. Default: `30s`.

- **keepalive_idle_conns** <span id="keepalive_idle_conns"/> defines the maximum number of connections to keep alive. Default: No limit.

- **keepalive_idle_conns_per_host** <span id="keepalive_idle_conns_per_host"/> if non-zero, controls the maximum idle (keep-alive) connections to keep per-host. Default: `32`.

- **versions** <span id="versions"/> allows customizing which versions of HTTP to support. As a special case, "h2c" is a valid value which will enable cleartext HTTP/2 connections to the upstream (however, this is a non-standard feature that does not use Go's default HTTP transport, so it is exclusive of other features; subject to change or removal). Default: `1.1 2`, or if scheme is `h2c://`, `h2c 2`

- **compression** <span id="compression"/> can be used to disable compression to the backend by setting it to `off`.

- **max_conns_per_host** <span id="max_conns_per_host"/> optionally limits the total number of connections per host, including connections in the dialing, active, and idle states. Default: No limit.



#### The `fastcgi` transport

```caddy-d
transport fastcgi {
	root  <path>
	split <at>
	env   <key> <value>
	resolve_root_symlink
	dial_timeout  <duration>
	read_timeout  <duration>
	write_timeout <duration>
	capture_stderr
}
```

- **root** <span id="root"/> is the root of the site. Default: `{http.vars.root}` or current working directory.

- **split** <span id="split"/> is where to split the path to get PATH_INFO at the end of the URI.

- **env** <span id="env"/> sets an extra environment variable to the given value. Can be specified more than once for multiple environment variables.

- **resolve_root_symlink** <span id="resolve_root_symlink"/> enables resolving the `root` directory to its actual value by evaluating a symbolic link, if one exists.

- **dial_timeout** <span id="dial_timeout"/> is how long to wait when connecting to the upstream socket. Accepts [duration values](/docs/conventions#durations). Default: `3s`.

- **read_timeout** <span id="read_timeout"/> is how long to wait when reading from the FastCGI server. Accepts [duration values](/docs/conventions#durations). Default: no timeout.

- **write_timeout** <span id="write_timeout"/> is how long to wait when sending to the FastCGI server. Accepts [duration values](/docs/conventions#durations). Default: no timeout.

- **capture_stderr** <span id="capture_stderr"/> enables capturing and logging of any messages sent by the upstream fastcgi server on `stderr`. Logging is done at `WARN` level by default. If the response has a `4xx` or `5xx` status, then the `ERROR` level will be used instead. By default, `stderr` is ignored.

<aside class="tip">

If you're trying to serve a modern PHP application, you may be looking for the [`php_fastcgi` directive](/docs/caddyfile/directives/php_fastcgi), which is a shortcut for a proxy using the `fastcgi` directive, with the necessary rewrites for using `index.php` as the routing entrypoint.

</aside>



### Intercepting responses

The reverse proxy can be configured to intercept responses from the backend. To facilitate this, response matchers can be defined (similar to the syntax for request matchers) and the first matching `handle_response` route will be invoked.

When a response handler is invoked, the response from the backend is not written to the client, and the configured `handle_response` route will be executed instead, and it is up to that route to write a response. If the route does _not_ write a response, then request handling will continue with any handlers that are [ordered after](/docs/caddyfile/directives#directive-order) this `reverse_proxy`.

- **@name** is the name of a [response matcher](#response-matcher). As long as each response matcher has a unique name, multiple matchers can be defined. A response can be matched on the status code and presence or value of a response header.
- **replace_status** <span id="replace_status"/> simply changes the status code of response when matched by the given matcher.
- **handle_response** <span id="handle_response"/> defines the route to execute when matched by the given matcher (or, if a matcher is omitted, all responses). The first matching block will be applied. Inside a `handle_response` block, any other [directives](/docs/caddyfile/directives) can be used.

Additionally, inside `handle_response`, two special handler directives may be used:

- **copy_response** <span id="copy_response"/> copies the response body received from the backend back to the client. Optionally allows changing the status code of the response while doing so. This directive is [ordered before `respond`](/docs/caddyfile/directives#directive-order).
- **copy_response_headers** <span id="copy_response_headers"/> copies the response headers from the backend to the client, optionally including _OR_ excluding a list of headers fields (cannot specify both `include` and `exclude`). This directive is [ordered after `header`](/docs/caddyfile/directives#directive-order).

Three placeholders will be made available within the `handle_response` routes:

- `{rp.status_code}` The status code from the backend's response.
- `{rp.status_text}` The status text from the backend's response.
- `{rp.header.*}` The headers from the backend's response.


#### Response matcher

**Response matchers** can be used to filter (or classify) responses by specific criteria.

##### status

```caddy-d
status <code...>
```

By HTTP status code.

- **&lt;code...&gt;** is a list of HTTP status codes. Special cases are `2xx`, `3xx`, ... which match against all status codes in the range of 200-299, 300-399, ... respectively

##### header

See the [`header`](/docs/caddyfile/matchers#header) request matcher for the supported syntax.





## Examples

Reverse proxy all requests to a local backend:

```caddy-d
reverse_proxy localhost:9005
```


Load-balance all requests between 3 backends:

```caddy-d
reverse_proxy node1:80 node2:80 node3:80
```


Same, but only requests within `/api`, and with header affinity:

```caddy-d
reverse_proxy /api/* node1:80 node2:80 node3:80 {
	lb_policy header X-My-Header
}
```


Configure some transport options:

```caddy-d
reverse_proxy localhost:8080 {
	transport http {
		dial_timeout 2s
		response_header_timeout 30s
	}
}
```


Reverse proxy to an HTTPS endpoint:

```caddy-d
reverse_proxy https://example.com {
	header_up Host {upstream_hostport}
}
```


Strip a path prefix before proxying:

```caddy-d
handle_path /prefix/* {
	reverse_proxy localhost:9000
}
```


Replace a path prefix before proxying:

```caddy-d
handle_path /old-prefix/* {
	rewrite * /new-prefix{path}
	reverse_proxy localhost:9000
}
```


X-Accel-Redirect support, i.e. serving static files as requested by the proxy upstream:

```caddy-d
reverse_proxy localhost:8080 {
	@accel header X-Accel-Redirect *
	handle_response @accel {
		root    * /path/to/private/files
		rewrite * {rp.header.X-Accel-Redirect}
		method  * GET
		file_server
	}
}
```


Custom error page for errors from upstream:

```caddy-d
reverse_proxy localhost:8080 {
	@error status 500 503
	handle_response @error {
		root    * /path/to/error/pages
		rewrite * /{rp.status_code}.html
		file_server
	}
}
```


Get backends dynamically from A/AAAA record DNS queries:

```caddy-d
reverse_proxy {
	dynamic a example.com 9000
}
```


Get backends dynamically from SRV record DNS queries:

```caddy-d
reverse_proxy {
	dynamic srv _api._tcp.example.com
}
```
