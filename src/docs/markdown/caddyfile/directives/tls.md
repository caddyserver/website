---
title: tls (Caddyfile directive)
---

# tls

Configures TLS for the site.

**Caddy's default TLS settings are secure. Only change these settings if you have a good reason and understand the implications.** The most common use of this directive will be to specify an ACME account email address, change the ACME CA endpoint, or to provide your own certificates.

Compatibility note: Due to its sensitive nature as a security protocol, deliberate adjustments to TLS defaults may be made in new minor or patch releases. Old or broken TLS versions, ciphers, features, etc. may be removed at any time. If your deployment is extremely sensitive to changes, you should explicitly specify those values which must remain constant, and be vigilant about upgrades. In almost every case, we recommend using the default settings.


## Syntax

```
tls [internal|<email>] | [<cert_file> <key_file>] {
	protocols <min> [<max>]
	ciphers   <cipher_suites...>
	curves    <curves...>
	alpn      <values...>
	load      <paths...>
	ca        <ca_dir_url>
	ca_root   <pem_file>
}
```

- **internal** means to use Caddy's internal, locally-trusted CA to produce certificates for this site.
- **&lt;email&gt;** is the email address to use for the ACME account managing the site's certificates.
- **&lt;cert_file&gt;** and **&lt;key_file&gt;** are the paths to the certificate and private key PEM files. Specifying just one is invalid; specifying both will disable automatic HTTPS.
- **protocols** specifies the minimum and maximum protocol versions. Default min: `tls1.2`. Default max: `tls1.3`
- **ciphers** specifies the list of cipher suites in descending preference order. Note that cipher suites are not customizable with TLS 1.3. Supported values are:
	- TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
	- TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
	- TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
	- TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
	- TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256
	- TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256
	- TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA
	- TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256
	- TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA
	- TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA
	- TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256
	- TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA
	- TLS_RSA_WITH_AES_128_GCM_SHA256
	- TLS_RSA_WITH_AES_256_GCM_SHA384
	- TLS_RSA_WITH_AES_256_CBC_SHA
	- TLS_RSA_WITH_AES_128_CBC_SHA256
	- TLS_RSA_WITH_AES_128_CBC_SHA
	- TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA
	- TLS_RSA_WITH_3DES_EDE_CBC_SHA
- **curves** specifies the list of EC curves to support. Supported values are:
	- x25519
	- p256
	- p384
	- p521
- **alpn** is the list of values to advertise in the ALPN extension of the TLS handshake.
- **load** specifies a list of folders from which to load PEM files that are certificate+key bundles.
- **ca** changes the ACME CA endpoint. This is most often used to use [Let's Encrypt's staging endpoint](https://letsencrypt.org/docs/staging-environment/) or an internal ACME server. (To change this value for the whole Caddyfile, use the `acme_ca` [global option](/docs/caddyfile/options) instead.)
- **ca_root** specifies a PEM file that contains a trusted root certificate for the ACME CA endpoint, if not in the system trust store.



## Examples

Specify an email address for your ACME account:

```
tls your@email.com
```

Use a custom certificate and key:

```
tls cert.pem key.pem
```

