---
title: Global options (Caddyfile)
---

# Global options

The Caddyfile has a way for you to specify options that apply globally. Some options act as default values, while others customize the behavior of the Caddyfile [adapter](/docs/config-adapters).

The very top of your Caddyfile can be a **global options block**. This is a block that has no keys:

```caddy
{
	...
}
```

There can only be one at most, and it must be the first block of the Caddyfile.

Possible options are:

```caddy
{
	# General Options
	debug
	http_port  <port>
	https_port <port>
	order <dir1> first|last|[before|after <dir2>]
	storage <module_name> {
		<options...>
	}
	admin   off|<addr> {
		origins <origins...>
		enforce_origin
	}

	# TLS Options
	auto_https off|disable_redirects
	email <yours>
	default_sni <name>
	local_certs
	acme_ca <directory_url>
	acme_ca_root <pem_file>
	acme_eab <key_id> <mac_key>
	acme_dns <provider> ...
	on_demand_tls {
		ask      <endpoint>
		interval <duration>
		burst    <n>
	}
	key_type ed25519|p256|p384|rsa2048|rsa4096
	cert_issuer <name> ...
	ocsp_stapling off

	# Server Options
	servers [<listener_address>] {
		listener_wrappers {
			<listener_wrappers...>
		}
		timeouts {
			read_body   <duration>
			read_header <duration>
			write       <duration>
			idle        <duration>
		}
		max_header_size <size>
		protocol {
			allow_h2c
			experimental_http3
			strict_sni_host
		}
	}
}
```

## General Options

##### `debug`
Enables debug mode, which sets all log levels to debug (unless otherwise specified).

##### `http_port`
The port for the server to use for HTTP. For internal use only; does not change the HTTP port for clients. Default: `80`

##### `https_port`
The port for the server to use for HTTPS. For internal use only; does not change the HTTPS port for clients. Default: `443`

##### `order`
Sets or changes the standard order of HTTP handler directive(s). Can set directives to be `first` or `last`, or `before` or `after` another directive.

##### `storage`
Configures Caddy's storage mechanism. The default is [`file_system`](/docs/json/storage/file_system/). There are many other available [storage modules](/docs/json/storage/) provided as plugins.

##### `admin`
Customizes the [admin API endpoint](/docs/api). If `off`, then the admin endpoint will be disabled. If disabled, config changes will be impossible without stopping and starting the server.

- **origins** configures the list of remotes/origins that are allowed to connect to the endpoint.

- **enforce_origin** enables enforcement of the Origin header. (This is different from enforcing origins generally, which is always done.)



## TLS Options

##### `auto_https`
Configure automatic HTTPS. It can either disable it entirely (`off`) or disable only HTTP-to-HTTPS redirects (`disable_redirects`). See the [Automatic HTTPS](/docs/automatic-https) page for more details.

##### `email`
Your email address. Mainly used when creating an ACME account with your CA, and is highly recommended in case there are problems with your certificates.

##### `default_sni`
Sets a default TLS ServerName for when clients do not use SNI in their ClientHello.

##### `local_certs`
Causes all certificates to be issued internally by default, rather than through a (public) ACME CA such as Let's Encrypt. This is useful in development environments.

##### `acme_ca`
Specifies the URL to the ACME CA's directory. It is strongly recommended to set this to Let's Encrypt's [staging endpoint](https://letsencrypt.org/docs/staging-environment/) for testing or development. Default: ZeroSSL and Let's Encrypt's production endpoints.

##### `acme_ca_root`
Specifies a PEM file that contains a trusted root certificate for ACME CA endpoints, if not in the system trust store.

##### `acme_eab`
Specifies an External Account Binding to use for all ACME transactions.

##### `acme_dns`
Configures the ACME DNS challenge provider to use for all ACME transactions. The tokens following the name of the provider set up the provider the same as if specified in the [`tls` directive's `acme` issuer](/docs/caddyfile/directives/tls#acme).

##### `on_demand_tls`
Configures [On-Demand TLS](/docs/automatic-https#on-demand-tls) where it is enabled, but does not enable it (to enable it, use the [on_demand `tls` subdirective](/docs/caddyfile/directives/tls#syntax)). Highly recommended if using in production environments, to prevent abuse.

- **ask** will cause Caddy to make an HTTP request to the given URL with a query string of `?domain=` containing the value of the domain name. If the endpoint returns 200 OK, Caddy will be authorized to obtain a certificate for that name.

- **interval** and **burst** allows `<n>` certificate operations within `<duration>` interval.

##### `key_type`
Specifies the type of key to generate for TLS certificates; only change this if you have a specific need to customize it.

##### `cert_issuer`
Defines the issuer (or source) of TLS certificates. The tokens following the name of the issuer set up the issuer the same as if specified in the [`tls` directive](/docs/caddyfile/directives/tls#issuer). May be repeated if you wish to configure more than one issuer to try. They will be tried in the order they are defined.

##### `ocsp_stapling`
Can be set to `off` to disable OCSP stapling. Useful in environments where responders are not reachable due to firewalls.



## Server Options

Customizes [HTTP servers](/docs/json/apps/http/servers/) with settings that potentially span multiple sites and thus can't be rightly configured in site blocks. These options affect the listener/socket, or other behavior beneath the HTTP layer.

Can be specified more than once, with different `listener_address` values, to configure different options per server. For example, `servers :443` will only apply to the server that is bound to the listener address `:443`. Omitting the listener address will apply the options to any remaining server.

<aside class="tip">
	Use the <a href="/docs/command-line#caddy-adapt"><code>caddy adapt</code></a> command to find the listen address for the servers in your Caddyfile.
</aside>

For example, to configure different options for the servers on port `:80` and `:443`, you would specify two `servers` blocks:

```caddy
{
	servers :443 {
		protocol {
			experimental_http3
		}
	}

	servers :80 {
		protocol {
			allow_h2c
		}
	}
}
```

##### `listener_wrappers`

Allows configuring [listener wrappers](/docs/json/apps/http/servers/listener_wrappers/), which can modify the behaviour of the base listener. They are applied in the given order.

There is a special no-op [`tls`](/docs/json/apps/http/servers/listener_wrappers/tls/) listener wrapper provided as a standard module which marks where TLS should be handled in the chain of listener wrappers. It should only be used if another listener wrapper must be placed in front of the TLS handshake.

For example, assuming you have the [`proxy_protocol`](/docs/json/apps/http/servers/listener_wrappers/proxy_protocol/) plugin installed:

```caddy-d
listener_wrappers {
	proxy_protocol {
		timeout 2s
		allow 192.168.86.1/24 192.168.86.1/24
	}
	tls
}
```

##### `timeouts`

- **read_timeout** is a [duration value](/docs/conventions#durations) that sets how long to allow a read from a client's upload. Setting this to a short, non-zero value can mitigate slowloris attacks, but may also affect legitimately slow clients. Defaults to no timeout.

- **read_header_timeout** is a [duration value](/docs/conventions#durations) that sets how long to allow a read from a client's request headers. Defaults to no timeout.

- **write_timeout** is a [duration value](/docs/conventions#durations) that sets how long to allow a write to a client. Note that setting this to a small value when serving large files may negatively affect legitimately slow clients. Defaults to no timeout.

- **idle_timeout** is a [duration value](/docs/conventions#durations) that sets the maximum time to wait for the next request when keep-alives are enabled. Defaults to 5 minutes to help avoid resource exhaustion.

##### `max_header_size`

The maximum size to parse from a client's HTTP request headers. It accepts all formats supported by [go-humanize](https://github.com/dustin/go-humanize/blob/master/bytes.go).

##### `protocol`

- **allow_h2c** enables H2C ("Cleartext HTTP/2" or "H2 over TCP") support, which will serve HTTP/2 over plaintext TCP connections if a client support it. Because this is not implemented by the Go standard library, using H2C is incompatible with most of the other options for this server. Do not enable this only to achieve maximum client compatibility. In practice, very few clients implement H2C, and even fewer require it. This setting applies only to unencrypted HTTP listeners. ⚠️ Experimental feature; subject to change or removal.

- **experimental_http3** enables experimental draft HTTP/3 support. Note that HTTP/3 is not a finished spec and client support is extremely limited. This option will go away in the future. _This option is not subject to compatibility promises._

- **strict_sni_host** require that a request's `Host` header matches the value of the ServerName sent by the client's TLS ClientHello; often a necessary safeguard when using TLS client authentication.
