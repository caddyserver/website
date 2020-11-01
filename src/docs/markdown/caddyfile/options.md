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
	debug
	http_port   <port>
	https_port  <port>
	default_sni <name>
	order <dir1> first|last|[before|after <dir2>]
	experimental_http3
	storage <module_name> {
		<options...>
	}
	acme_ca <directory_url>
	acme_ca_root <pem_file>
	acme_eab <key_id> <mac_key>
	acme_dns <provider>
	email   <yours>
	admin   off|<addr> {
		origins <origins...>
		enforce_origin
	}
	on_demand_tls {
		ask      <endpoint>
		interval <duration>
		burst    <n>
	}
	local_certs
	key_type ed25519|p256|p384|rsa2048|rsa4096
	auto_https off|disable_redirects
	cert_issuer <name> ...
}
```

##### `debug`
Enables debug mode, which sets all log levels to debug (unless otherwise specified).

##### `http_port`
The port for the server to use for HTTP. For internal use only; does not change the HTTP port for clients. Default: `80`

##### `https_port`
The port for the server to use for HTTPS. For internal use only; does not change the HTTPS port for clients. Default: `443`

##### `default_sni`
Sets a default TLS ServerName for when clients do not use SNI in their ClientHello.

##### `order`
Sets or changes the standard order of HTTP handler directive(s). Can set directives to be `first` or `last`, or `before` or `after` another directive.

##### `experimental_http3`
Enables experimental draft HTTP/3 support. Note that HTTP/3 is not a finished spec and client support is extremely limited. This option will go away in the future. _This option is not subject to compatibility promises._

##### `storage`
Configures Caddy's storage mechanism. Default: `file_system`

##### `acme_ca`
Specifies the URL to the ACME CA's directory. It is strongly recommended to set this to Let's Encrypt's [staging endpoint](https://letsencrypt.org/docs/staging-environment/) for testing or development. Default: Let's Encrypt's production endpoint.

##### `acme_ca_root`
Specifies a PEM file that contains a trusted root certificate for ACME CA endpoints, if not in the system trust store.

##### `acme_eab`
Specifies an External Account Binding to use for all ACME transactions.

##### `acme_dns`
Configures the DNS challenge to use for all ACME transactions.

##### `email`
Your email address. Mainly used when creating an ACME account with your CA, and is highly recommended in case there are problems with your certificates.

##### `admin`
Customizes the [admin API endpoint](/docs/api). If `off`, then the admin endpoint will be disabled. If disabled, config changes will be impossible without stopping and starting the server.
- **origins** configures the list of remotes/origins that are allowed to connect to the endpoint.
- **enforce_origin** enables enforcement of the Origin header. (This is different from enforcing origins generally, which is always done.)

##### `on_demand_tls`
Configures [On-Demand TLS](/docs/automatic-https#on-demand-tls) where it is enabled, but does not enable it (to enable it, use the [on_demand `tls` subdirective](/docs/caddyfile/directives/tls#syntax)). Highly recommended if using in production environments, to prevent abuse.
- **ask** will cause Caddy to make an HTTP request to the given URL with a query string of `?domain=` containing the value of the domain name. If the endpoint returns 200 OK, Caddy will be authorized to obtain a certificate for that name.
- **interval** and **burst** allows `<n>` certificate operations within `<duration>` interval.

##### `local_certs`
Causes all certificates to be issued internally by default, rather than through a (public) ACME CA such as Let's Encrypt. This is useful in development environments.

##### `key_type`
Specifies the type of key to generate for TLS certificates; only change this if you have a specific need to customize it.

##### `auto_https`
Configure automatic HTTPS. It can either disable it entirely (`off`) or disable only HTTP-to-HTTPS redirects (`disable_redirects`). See the [Automatic HTTPS](/docs/automatic-https) page for more details.

##### `cert_issuer`
Defines the issuer (or source) of TLS certificates.
