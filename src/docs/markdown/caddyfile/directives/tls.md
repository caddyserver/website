---
title: tls (Caddyfile directive)
---

# tls

Configures TLS for the site.

**Caddy's default TLS settings are secure. Only change these settings if you have a good reason and understand the implications.** The most common use of this directive will be to specify an ACME account email address, change the ACME CA endpoint, or to provide your own certificates.

Compatibility note: Due to its sensitive nature as a security protocol, deliberate adjustments to TLS defaults may be made in new minor or patch releases. Old or broken TLS versions, ciphers, features, etc. may be removed at any time. If your deployment is extremely sensitive to changes, you should explicitly specify those values which must remain constant, and be vigilant about upgrades. In almost every case, we recommend using the default settings.


## Syntax

```caddy-d
tls [internal|<email>] | [<cert_file> <key_file>] {
	protocols <min> [<max>]
	ciphers   <cipher_suites...>
	curves    <curves...>
	alpn      <values...>
	load      <paths...>
	ca        <ca_dir_url>
	ca_root   <pem_file>
	dns       <provider_name> [<params...>]
	on_demand
	clients {
    mode [request|require|verify_if_given|require_and_verify]
		trusted_ca_certs        <trusted_ca_certs...>
		trusted_ca_certs_file   <filename...>
		trusted_leaf_certs      <trusted_leaf_certs...>
		trusted_leaf_certs_file <filename...>
  }
}
```

- **internal** means to use Caddy's internal, locally-trusted CA to produce certificates for this site.
- **&lt;email&gt;** is the email address to use for the ACME account managing the site's certificates.
- **&lt;cert_file&gt;** and **&lt;key_file&gt;** are the paths to the certificate and private key PEM files. Specifying just one is invalid; specifying both will disable automatic HTTPS.
- **protocols** specifies the minimum and maximum protocol versions. Default min: `tls1.2`. Default max: `tls1.3`
- **ciphers** specifies the list of cipher suite names in descending preference order. Note that cipher suites are not customizable with TLS 1.3. The supported names are (in no particular order here):
	- TLS_RSA_WITH_3DES_EDE_CBC_SHA
	- TLS_RSA_WITH_AES_128_CBC_SHA
	- TLS_RSA_WITH_AES_256_CBC_SHA
	- TLS_RSA_WITH_AES_128_GCM_SHA256
	- TLS_RSA_WITH_AES_256_GCM_SHA384
	- TLS_AES_128_GCM_SHA256
	- TLS_AES_256_GCM_SHA384
	- TLS_CHACHA20_POLY1305_SHA256
	- TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA
	- TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA
	- TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA
	- TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA
	- TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA
	- TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
	- TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
	- TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
	- TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
	- TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256
	- TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256
- **curves** specifies the list of EC curves to support. Supported values are:
	- x25519
	- secp256r1
	- secp384r1
	- secp521r1
- **alpn** is the list of values to advertise in the ALPN extension of the TLS handshake.
- **load** specifies a list of folders from which to load PEM files that are certificate+key bundles.
- **ca** changes the ACME CA endpoint. This is most often used to use [Let's Encrypt's staging endpoint](https://letsencrypt.org/docs/staging-environment/) or an internal ACME server. (To change this value for the whole Caddyfile, use the `acme_ca` [global option](/docs/caddyfile/options) instead.)
- **ca_root** specifies a PEM file that contains a trusted root certificate for the ACME CA endpoint, if not in the system trust store.
- **dns** enables the [DNS challenge](/docs/automatic-https#dns-challenge) using the specified provider plugin, which must be plugged in from one of the [caddy-dns](https://github.com/caddy-dns) repositories. Each provider plugin may have their own syntax following their name; refer to their docs for details. Maintaining support for each DNS provider is a community effort. [Learn how to enable the DNS challenge for your provider at our wiki.](https://caddy.community/t/how-to-use-dns-provider-modules-in-caddy-2/8148)
- **on_demand** enables [on-demand TLS](/docs/automatic-https#on-demand-tls) for the hostnames given in the site block's address(es).
- **clients** enables and configures TLS client authentication.

The `clients` block can look like this:

```caddy-d
clients {
	mode                    [request|require|verify_if_given|require_and_verify]
	trusted_ca_certs        <trusted_ca_certs...>
	trusted_ca_certs_file   <filename...>
	trusted_leaf_certs      <trusted_leaf_certs...>
	trusted_leaf_certs_file <filename...>
}
```

- **trusted_ca_certs** is a list of base64 DER-encoded CA certificates against which to validate client certificates. Client certs which are not signed by any of these CAs will be rejected.
- **trusted_ca_certs_file** is a list of base64 DER-encoded CA certificate files against which to validate client certificates. Client certs which are not signed by any of these CAs will be rejected.
- **trusted_leaf_certs** is a list of base64 DER-encoded client leaf certs to accept. If this list is not empty, client certs which are not in this list will be rejected
- **trusted_leaf_certs_file** is a list of base64 DER-encoded CA certificate files against which to validate client certificates. Client certs which are not signed by any of these CAs will be rejected.
- **mode** is the mode for authenticating the client. Allowed values are:
  | Mode               | Description                                                                              |
  |--------------------|------------------------------------------------------------------------------------------|
  | request            | Ask clients for a certificate, but allow even if there isn't one; do not verify it       |
  | require            | Require clients to present a certificate, but do not verify it                           |
  | verify_if_given    | Ask clients for a certificate; allow even if there isn't one, but verify it if there is  |
	| require_and_verify | Require clients to present a valid certificate that is verified                          |

	The default mode is `require_and_verify` if any TrustedCACerts or TrustedLeafCerts are provided; otherwise, the default mode is `require`


## Examples

Use a custom certificate and key:

```caddy-d
tls cert.pem key.pem
```

Use locally-trusted certificates for all hosts on the current site block, rather than public certificates via ACME / Let's Encrypt (useful in dev environments):

```caddy-d
tls internal
```

Use locally-trusted certificates, but managed on-demand intead of in the background:

```caddy-d
tls internal {
	on_demand
}
```

Specify an email address for your ACME account (but if only one email is used for all sites, we recommend the `email` [global option](/docs/caddyfile/options) instead):

```caddy-d
tls your@email.com
```

Enable the DNS challenge for a domain managed on Cloudflare with account credentials in an environment variable:

```caddy-d
tls {
	dns cloudflare {env.CLOUDFLARE_API_TOKEN}
}
```

Enable TLS Client Authentication

```caddy-d
tls {
  clients {
    mode                    require_and_verify
    trusted_ca_certs_file   cacerts.crt
  }
}
```
