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
	ca <id>
}
```

- **ca** specifies the ID of the certificate authority with which to sign certificates. The default is `local`, which is Caddy's default CA, intended for locally-used, self-signed certificates, which is most common in dev environments. For broader use, it is recommended to specify a different CA to avoid confusion. If the CA with the given ID does not already exist, it will be created.

