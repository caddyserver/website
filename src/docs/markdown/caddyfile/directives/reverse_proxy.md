---
title: reverse_proxy (Caddyfile directive)
---

# reverse_proxy

Proxies requests to one or more backends with configurable transport, load balancing, health checking, header manipulation, and buffering options.


## Syntax

```caddy-d
reverse_proxy [<matcher>] [<upstreams...>] {
    # backends
    to <upstreams...>
	...

    # load balancing
    lb_policy       <name> [<options...>]
    lb_try_duration <duration>
    lb_try_interval <interval>

    # active health checking
    health_path     <path>
    health_port     <port>
    health_interval <interval>
    health_timeout  <duration>
    health_status   <status>
    health_body     <regexp>

    # passive health checking
    fail_duration     <duration>
    max_fails         <num>
    unhealthy_status  <status>
    unhealthy_latency <duration>
    unhealthy_request_count <num>

    # streaming
    flush_interval <duration>
    buffer_requests

    # header manipulation
    header_up   [+|-]<field> [<value|regexp> [<replacement>]]
    header_down [+|-]<field> [<value|regexp> [<replacement>]]

    # round trip
    transport <name> {
        ...
    }
}
```

### Upstreams

- **&lt;upstreams...&gt;** is a list of upstreams (backends) to which to proxy.
- **to** is an alternate way to specify the list of upstreams, one (or more) per line.

Upstream addresses can take the form of a conventional [Caddy network address](/docs/conventions#network-addresses) or a URL that contains only scheme and host/port, with a special exception that the scheme may be prefixed by `srv+` to enable SRV DNS record lookups for load balancing. Valid examples:

- `localhost:4000`
- `127.0.0.1:4000`
- `http://localhost:4000`
- `https://example.com`
- `h2c://127.0.0.1`
- `example.com`
- `unix//var/php.sock`
- `srv+http://internal.service.consul`
- `srv+https://internal.service.consul`

Note: Schemes cannot be mixed, since they modify the common transport configuration (a TLS-enabled transport cannot carry both HTTPS and plaintext HTTP). Specifying ports 80 and 443 are the same as specifying the HTTP and HTTPS schemes, respectively. Any explicit transport configuration will not be overwritten, and omitting schemes or using other ports will not assume a particular transport. Additionally, schemes cannot contain paths or query strings, as that would imply simultaneous rewriting the request while proxying, which behavior is not defined or supported. If the address is not a URL (i.e. does not have a scheme), then placeholders can be used, but this makes the upstream dynamic.

### Load balancing

Load balancing is used whenever more than one upstream is defined.

- **lb_policy** is the name of the load balancing policy, along with any options. Default: `random`. Can be:
	- `first` - choose first available upstream
	- `header` - map request header to sticky upstream
	- `ip_hash` - map client IP to sticky upstream
	- `least_conn` - choose upstream with fewest number of current requests
	- `random` - randomly choose an upstream
	- `random_choose <n>` - selects two or more upstreams randomly, then chooses one with least load (`n` is usually 2)
	- `round_robin` - iterate each upstream in turn
	- `uri_hash` - map URI to sticky upstream
	- `cookie [<name> [<secret>]]` - based on the given cookie (default name is `lb` if not specified), which value is hashed; optionally with a secret for HMAC-SHA256

- **lb_try_duration** is a [duration value](/docs/conventions#durations) that defines how long to try selecting available backends for each request if the next available host is down. By default, this retry is disabled. Clients will wait for up to this long while the load balancer tries to find an available upstream host.
- **lb_try_interval** is a [duration value](/docs/conventions#durations) that defines how long to wait between selecting the next host from the pool. Default is `250ms`. Only relevant when a request to an upstream host fails. Be aware that setting this to 0 with a non-zero `lb_try_duration` can cause the CPU to spin if all backends are down and latency is very low.

#### Active health checks

Active health checks perform health checking in the background on a timer:

- **health_path** is the URI path for active health checks.
- **health_port** is the port to use for active health checks, if different from the upstream's port.
- **health_interval** is a [duration value](/docs/conventions#durations) that defines how often to perform active health checks.
- **health_timeout** is a [duration value](/docs/conventions#durations) that defines how long to wait for a reply before marking the backend as down.
- **health_status** is the HTTP status code to expect from a healthy backend. Can be a 3-digit status code or a status code class ending in `xx`, for example: `200` (default) or `2xx`.
- **health_body** is a substring or regular expression to match on the response body of an active health check. If the backend does not return a matching body, it will be marked as down.

#### Passive health checks

Passive health checks happen inline with actual proxied requests:

- **fail_duration**  is a [duration value](/docs/conventions#durations) that defines how long to remember a failed request. A duration > 0 enables passive health checking.
- **max_fails** is the maximum number of failed requests within fail_timeout that are needed before considering a backend to be down; must be >= 1; default is 1.
- **unhealthy_status** counts a request as failed if the response comes back with one of these status codes. Can be a 3-digit status code or a status code class ending in `xx`, for example: `404` or `5xx`.
- **unhealthy_latency** is a [duration value](/docs/conventions#durations) that counts a request as failed if it takes this long to get a response.
- **unhealthy_request_count** is the permissible number of simultaneous requests to a backend before marking it as down.

### Streaming

The proxy **buffers responses** by default for wire efficiency:

- **flush_interval** is a [duration value](/docs/conventions#durations) that defines how often Caddy should flush the buffered response body to the client. Set to -1 to disable buffering. It is set to -1 automatically for requests that have a `text/event-stream` response or for HTTP/2 requests where the Content-Length is unspecified.
- **buffer_requests** will cause the proxy to read the entire request body into a buffer before sending it upstream. This is very inefficient and should only be done if the upstream requires reading request bodies without delay (which is something the upstream application should fix).

### Headers

It can also **manipulate headers** between itself and the backend:

- **header_up** Sets, adds, removes, or performs a replacement in a request header going upstream to the backend.
- **header_down** Sets, adds, removes, or performs a replacement in a response header coming downstream from the backend.

By default, Caddy passes thru incoming headers to the backend&mdash;including the `Host` header&mdash;without modifications, with two exceptions:

- It adds or augments the [X-Forwarded-For](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) header field.
- It sets the [X-Forwarded-Proto](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto) header field.

Since these header fields are only de-facto standards, Caddy may stop setting them implicitly in the future if the standardized [Forwarded](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded) header field becomes more widely adopted.

### Transports

Caddy's proxy **transport** is pluggable:

- **transport** defines how to communicate with the backend. Default is `http`.

#### The `http` transport

```caddy-d
transport http {
	read_buffer  <size>
	write_buffer <size>
	dial_timeout <duration>
	tls
	tls_client_auth <automate_name> | <cert_file> <key_file>
	tls_insecure_skip_verify
	tls_timeout <duration>
	tls_trusted_ca_certs <pem_files...>
    tls_server_name <sni>
	keepalive [off|<duration>]
	keepalive_idle_conns <max_count>
    versions <versions...>
    compression off
    max_conns_per_host <count>
    max_idle_conns_per_host <count>
}
```

- **read_buffer** is the size of the read buffer in bytes.
- **write_buffer** is the size of the write buffer in bytes.
- **dial_timeout** is how long to wait when connecting to the upstream socket.
- **tls** uses HTTPS with the backend. This will be enabled automatically if you specify backends using the `https://` scheme or port `:443`.
- **tls_client_auth** enables TLS client authentication one of two ways: (1) by specifying a domain name for which Caddy should obtain a certificate and keep it renewed, or (2) by specifying a certificate and key file to present for TLS client authentication with the backend.
- **tls_insecure_skip_verify** turns off security. _Do not use in production._
- **tls_timeout** is a [duration value](/docs/conventions#durations) that specifies how long to wait for the TLS handshake to complete.
- **tls_trusted_ca_certs** is a list of PEM files that specify CA public keys to trust when connecting to the backend.
- **tls_server_name** sets the ServerName (SNI) to put in the ClientHello; only needed if the remote server requires it.
- **keepalive** is either `off` or a [duration value](/docs/conventions#durations) that specifies how long to keep connections open.
- **keepalive_idle_conns** defines the maximum number of connections to keep alive.
- **versions** allows customizing which versions of HTTP to support. As a special case, "h2c" is a valid value which will enable cleartext HTTP/2 connections to the upstream (however, this is a non-standard feature that does not use Go's default HTTP transport, so it is exclusive of other features; subject to change or removal). Default: `1.1 2`, or if scheme is `h2c://`, `h2c 2`
- **compression** can be used to disable compression to the backend by setting it to `off`.
- **max_conns_per_host** optionally limits the total number of connections per host, including connections in the dialing, active, and idle states. Has no limit by default.
- **max_idle_conns_per_host** if non-zero, controls the maximum idle (keepalive) connections to keep per-host. Default: `2`

#### The `fastcgi` transport

```caddy-d
transport fastcgi {
	root  <path>
	split <at>
	env   <key> <value>
    resolve_root_symlink
}
```

- **root** is the root of the site. Default: `{http.vars.root}` or current working directory.
- **split** is where to split the path to get PATH_INFO at the end of the URI.
- **env** sets custom environment variables.
- **resolve_root_symlink** The declared root directory will be resolved to its actual value by evaluating any symbolic links.


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

Set the upstream Host header to the address of the upstream (by default, it will retain its original, incoming value):

```caddy-d
reverse_proxy localhost:9000 {
	header_up Host {http.reverse_proxy.upstream.hostport}
}
```

Reverse proxy to an HTTPS endpoint:

```caddy-d
reverse_proxy https://example.com
```

Strip a path prefix then proxy:

```caddy-d
route /prefix/* {
	uri strip_prefix /prefix
	reverse_proxy localhost:9000
}
```
