---
title: "Module Namespaces"
---

# Module Namespaces

Caddy guest modules are loaded generically as `interface{}` or `any` types. In order for the host modules to be able to use them, the loaded guest modules are usually type-asserted to a known type first. This page describes the mapping from module namespaces to Go types for all the standard modules.

Documentation for non-standard module namespaces can be found with the documentation for the host module that defines them.

<aside class="tip">
	One way to read this table is, "If your module is in &lt;namespace&gt;, then it should compile as &lt;type&gt;."
</aside>

Namespace | Expected Interface Type | Description | Notes
--------- | ------------- | ----------- | ----------
|         | [`caddy.App`](https://pkg.go.dev/github.com/caddyserver/caddy/v2#App) | Caddy app
admin.api | [`caddy.AdminRouter`](https://pkg.go.dev/github.com/caddyserver/caddy/v2#AdminRouter)<br><br>[`caddy.AdminHandler`](https://pkg.go.dev/github.com/caddyserver/caddy/v2#AdminHandler) | Registers HTTP routes for admin<br><br>HTTP handler middleware |
caddy.config_loaders | [`caddy.ConfigLoader`](https://pkg.go.dev/github.com/caddyserver/caddy/v2#ConfigLoader) | Loads a config | <i>⚠️ Experimental</i>
caddy.fs  | [`fs.FS`](https://pkg.go.dev/io/fs#FS) | Virtual file system |  <i>⚠️ Experimental</i>
caddy.listeners | [`caddy.ListenerWrapper`](https://pkg.go.dev/github.com/caddyserver/caddy/v2#ListenerWrapper) | Wrap network listeners
caddy.logging.encoders | [`zapcore.Encoder`](https://pkg.go.dev/go.uber.org/zap/zapcore#Encoder) | Log entry encoder
caddy.logging.encoders.filter | [`logging.LogFieldFilter`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/logging#LogFieldFilter) | Log field filter
caddy.logging.writers | [`caddy.WriterOpener`](https://pkg.go.dev/github.com/caddyserver/caddy/v2#WriterOpener) | Log writers
caddy.storage | [`caddy.StorageConverter`](https://pkg.go.dev/github.com/caddyserver/caddy/v2#StorageConverter) | Storage backends
dns.providers | [`certmagic.DNSProvider`](https://pkg.go.dev/github.com/caddyserver/certmagic#DNSProvider) | DNS challenge solver
events.handlers | [`caddyevents.Handler`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyevents#Handler) | Event handlers | <i>⚠️ Experimental</i>
http.authentication.hashes | [`caddyauth.Comparer`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/caddyauth#Comparer)<br><br>[`caddyauth.Hasher`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/caddyauth#Hasher) | Password comparers<br><br>Password hashers
http.authentication.providers | [`caddyauth.Authenticator`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/caddyauth#Authenticator) | HTTP authentication providers
http.encoders | [`encode.Encoding`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/encode#Encoding)<br><br>[`encode.Encoder`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/encode#Encoder) | Creates an encoder (compression)<br><br>Encodes a data stream
http.handlers | [`caddyhttp.MiddlewareHandler`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp#MiddlewareHandler) | HTTP handlers
http.ip_sources | [`caddyhttp.IPRangeSource`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp#IPRangeSource) | IP ranges for trusted proxies
http.matchers | [`caddyhttp.RequestMatcher`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp#RequestMatcher)<br><br>[`caddyhttp.CELLibraryProducer`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp#CELLibraryProducer) | HTTP request matchers<br><br>Support for CEL expressions | <br><br><i>(Optional)</i>
http.precompressed | [`encode.Precompressed`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/encode#Precompressed) | Supported precompress mappings
http.reverse_proxy.circuit_breakers | [`reverseproxy.CircuitBreaker`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/reverseproxy#CircuitBreaker) | Reverse proxy circuit breakers
http.reverse_proxy.selection_policies | [`reverseproxy.Selector`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/reverseproxy#Selector) | Load balancing selection policies
http.reverse_proxy.transport | [`http.RoundTripper`](https://pkg.go.dev/net/http#RoundTripper) | HTTP reverse proxy transports
http.reverse_proxy.upstreams | [`reverseproxy.UpstreamSource`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddyhttp/reverseproxy#UpstreamSource) | Dynamic upstream source | <i>⚠️ Experimental</i>
tls.ca_pool.source | [`caddytls.CA`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddytls#CA) | Source of trusted root certs
tls.certificates | [`caddytls.CertificateLoader`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddytls#CertificateLoader) | TLS certificate source
tls.client_auth | [`caddytls.ClientCertificateVerifier`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddytls#ClientCertificateVerifier) | Verifies client certificates
tls.ech.publishers | [`caddytls.ECHPublisher`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddytls#ECHPublisher) | Publishes Encrypted ClientHello (ECH) configurations | <i>⚠️ Experimental</i>
tls.get_certificate | [`certmagic.Manager`](https://pkg.go.dev/github.com/caddyserver/certmagic#Manager) | TLS certificate manager | <i>⚠️ Experimental</i>
tls.handshake_match | [`caddytls.ConnectionMatcher`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddytls#ConnectionMatcher) | TLS connection matcher
tls.issuance | [`certmagic.Issuer`](https://pkg.go.dev/github.com/caddyserver/certmagic#Issuer) | TLS certificate issuer
tls.leaf_cert_loader | [`caddytls.LeafCertificateLoader`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddytls#LeafCertificateLoader) | Loads trusted leaf certs
tls.permission | [`caddytls.OnDemandPermission`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddytls#OnDemandPermission) | Whether to obtain a cert for a domain | <i>⚠️ Experimental</i>
tls.stek | [`caddytls.STEKProvider`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/modules/caddytls#STEKProvider) | TLS session ticket key source

Namespaces marked as "Experimental" are subject to change. (Please develop with them so we can finalize their interfaces!)
