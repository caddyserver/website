---
title: Global options (Caddyfile)
---

# Global options

The Caddyfile has a way for you to specify options that apply globally. Some options act as default values, while others customize the behavior of the Caddyfile [adapter](/docs/config-adapters).

The very top of your Caddyfile can be a **global options block**. This is a block that has no keys:

```
{
	...
}
```

There can only be one at most, and it must be the first block of the Caddyfile.

Possible options are:

```
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
	email   <yours>
	admin   off|<addr>
	on_demand_tls {
		ask      <endpoint>
		interval <duration>
		burst    <n>
	}
	local_certs
}
```

- **debug** enables debug mode, which sets all log levels to debug (unless otherwise specified).
- **http_port** is the port for the server to use for HTTP. For internal use only; does not change the HTTP port for clients. Default: 80
- **https_port** is the port for the server to use for HTTPS. For internal use only; does not change the HTTPS port for clients. Default: 443
- **default_sni** sets a default TLS ServerName for when clients do not use SNI in their ClientHello.
- **order** sets or changes the standard order of HTTP handler directive(s). Can set directives to be `first` or `last`, or `before` or `after` another directive.
- **experimental_http3** enables experimental draft HTTP/3 support. Note that HTTP/3 is not a finished spec and client support is extremely limited. This option will go away in the future. _This option is not subject to compatibility promises._
- **storage** configures Caddy's storage mechanism. Default: `file_system`
- **acme_ca** specifies the URL to the ACME CA's directory. It is strongly recommended to set this to Let's Encrypt's [staging endpoint](https://letsencrypt.org/docs/staging-environment/) for testing or development. Default: Let's Encrypt's production endpoint.
- **acme_ca_root** specifies a PEM file that contains a trusted root certificate for ACME CA endpoints, if not in the system trust store.
- **email** is your email address. Mainly used when creating an ACME account with your CA, and is highly recommended in case there are problems with your certificates.
- **admin** customizes the [admin API endpoint](/docs/api). If `off`, then the admin endpoint will be disabled. If disabled, config changes will be impossible without stopping and starting the server.
- **on_demand_tls** configures [On-Demand TLS](/docs/automatic-https#on-demand-tls) where it is enabled, but does not enable it (to enable it, use the [on_demand `tls` subdirective](/docs/caddyfile/directives/tls#syntax)). Highly recommended if using in production environments, to prevent abuse.
	- **ask** will cause Caddy to make an HTTP request to the given URL with a query string of `?domain=` containing the value of the domain name. If the endpoint returns 200 OK, Caddy will be authorized to obtain a certificate for that name.
	- **interval** and **burst** allows `<n>` certificate operations within `<duration>` interval.
- **local_certs** causes all certificates to be issued internally by default, rather than through a (public) ACME CA such as Let's Encrypt. This is useful in development environments.