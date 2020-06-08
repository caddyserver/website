---
title: acme_server (Caddyfile directive)
---

# acme_server

An embedded [ACME protocol](https://tools.ietf.org/html/rfc8555) server handler. This allows a Caddy instance to issue certificates for any other ACME-compatible software (including other Caddy instances).

When enabled, requests matching the path `/acme/*` will be handled by the ACME server.


## Client configuration

Using ACME server defaults, ACME clients should simply be configured to use `https://localhost/acme/directory` as their ACME endpoint.


## Syntax

```caddy-d
acme_server [<matcher>]
```
