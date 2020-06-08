---
title: "Module Namespaces"
---

# Module Namespaces

Caddy guest modules are loaded generically as `interface{}` types. In order for the host modules to be able to use them, the loaded guest modules are usually type-asserted to a known type first. This page describes the mapping from module namespaces to Go types for all the standard modules.

Documentation for non-standard module namespaces can be found with the documentation for the host module that defines them.

<aside class="tip">
	One way to read this table is, "If your module is in &lt;namespace&gt;, then it should compile as &lt;type&gt;."
</aside>

Namespace | Expected Type | Description
--------- | ------------- | -----------
|         | [`caddy.App`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#App) | Caddy app
caddy.logging.encoders.filter | [`logging.LogFieldFilter`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/logging?tab=doc#LogFieldFilter) | Log field filter</i>
caddy.logging.writers | [`caddy.WriterOpener`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#WriterOpener) | Log writers
caddy.storage | [`caddy.StorageConverter`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#StorageConverter) | Storage backends
http.authentication.hashes | [`caddyauth.Comparer`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/caddyauth?tab=doc#Comparer) | Password hashers/comparers
http.authentication.providers | [`caddyauth.Authenticator`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/caddyauth?tab=doc#Authenticator) | HTTP authentication providers
http.handlers | [`caddyhttp.MiddlewareHandler`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp?tab=doc#MiddlewareHandler) | HTTP handlers
http.matchers | [`caddyhttp.RequestMatcher`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp?tab=doc#RequestMatcher) | HTTP request matchers<br><i>⚠️ Subject to change</i>
http.reverse_proxy.circuit_breakers | [`reverseproxy.CircuitBreaker`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/reverseproxy?tab=doc#CircuitBreaker) | Reverse proxy circuit breakers
http.reverse_proxy.selection_policies | [`reverseproxy.Selector`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/reverseproxy?tab=doc#Selector) | Load balancing selection policies<br><i>⚠️ Subject to change</i>
http.reverse_proxy.transport | [`http.RoundTripper`](https://pkg.go.dev/net/http?tab=doc#RoundTripper) | HTTP reverse proxy transports
tls.certificates | [`caddytls.CertificateLoader`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddytls?tab=doc#CertificateLoader) | TLS certificate source</i>
tls.handshake_match | [`caddytls.ConnectionMatcher`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddytls?tab=doc#ConnectionMatcher) | TLS connection matcher</i>
tls.issuance | [`certmagic.Issuer`](https://pkg.go.dev/github.com/caddyserver/certmagic?tab=doc#Issuer) | TLS certificate issuer<br><i>⚠️ Subject to change</i>
tls.stek | [`caddytls.STEKProvider`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddytls?tab=doc#STEKProvider) | TLS session ticket key source</i>
