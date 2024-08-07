---
title: acme_server (Caddyfile directive)
---

# acme_server

An embedded [ACME protocol](https://tools.ietf.org/html/rfc8555) server handler. This allows a Caddy instance to issue certificates for any other ACME-compatible software (including other Caddy instances).

When enabled, requests matching the path `/acme/*` will be handled by the ACME server.


## Client configuration

Using ACME server defaults, ACME clients should simply be configured to use `https://localhost/acme/local/directory` as their ACME endpoint. (`local` is the ID of Caddy's default CA.)


## Syntax

```caddy-d
acme_server [<matcher>] {
	ca         <id>
	lifetime   <duration>
	resolvers  <resolvers...>
	challenges <challenges...>
	allow_wildcard_names
	allow {
		domains <domains...>
		ip_ranges <addresses...>
	}
	deny {
		domains <domains...>
		ip_ranges <addresses...>
	}
}
```

- **ca** specifies the ID of the certificate authority with which to sign certificates. The default is `local`, which is Caddy's default CA, intended for locally-used, self-signed certificates, which is most common in dev environments. For broader use, it is recommended to specify a different CA to avoid confusion. If the CA with the given ID does not already exist, it will be created. See the [PKI app global options](/docs/caddyfile/options#pki-options) to configure alternate CAs.

- **lifetime** (Default: `12h`) is a [duration](/docs/conventions#durations) which specifies the validity period for issued certificates. This value must be less than the lifetime of the [intermediate certificate](/docs/caddyfile/options#intermediate-lifetime) used for signing. It is not recommended to change this unless absolutely necessary.

- **resolvers** are the addresses of DNS resolvers to use when looking up the TXT records for solving ACME DNS challenges. Accepts [network addresses](/docs/conventions#network-addresses) defaulting to UDP and port 53 unless specified. If the host is an IP address, it will be dialed directly to resolve the upstream server. If the host is not an IP address, the addresses are resolved using the [name resolution convention](https://golang.org/pkg/net/#hdr-Name_Resolution) of the Go standard library. If multiple resolvers are specified, then one is chosen at random.

- **challenges** sets the enabled challenge types. If not set or the directive is used without values, then all challenge types are enabled. Accepted values are: http-01, tls-alpn-01, dns-01.

- **allow_wildcard_names** enables issuing of certificates with wildcard SAN (Subject Alternative Name)

- **allow**, **deny** configure the operational policy of the `acme_server`. The policy evaluation follows the criteria described by Step-CA [here](https://smallstep.com/docs/step-ca/policies/#policy-evaluation).

	- **domains** sets the subject domain names to be allowed or denied per the policy evaluation criteria.

	- **ip_ranges** sets the subject IP ranges to be allowed or denied per the policy evaluation criteria.

## Examples

To serve an ACME server with ID `home` on the domain `acme.example.com`, with the CA customized via the [`pki` global option](/docs/caddyfile/options#pki-options), and issuing its own certificate using the `internal` issuer:

```caddy
{
	pki {
		ca home {
			name "My Home CA"
		}
	}
}

acme.example.com {
	tls {
		issuer internal {
			ca home
		}
	}
	acme_server {
		ca home
	}
}
```

If you have another Caddy server, it can use the above ACME server to issue its own certificates:

```caddy
{
	acme_ca https://acme.example.com/acme/home/directory
	acme_ca_root /path/to/home_ca_root.crt
}

example.com {
	respond "Hello, world!"
}
```
