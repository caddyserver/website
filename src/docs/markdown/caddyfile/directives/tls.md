---
title: tls (Caddyfile directive)
---

<script>
window.$(function() {
	// We'll add links to all the subdirectives if a matching anchor tag is found on the page.
	addLinksToSubdirectives();
});
</script>

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
	key_type  ed25519|p256|p384|rsa2048|rsa4096
	dns       <provider_name> [<params...>]
	propagation_timeout <duration>
	propagation_delay   <duration>
	dns_ttl             <duration>
	dns_challenge_override_domain <domain>
	resolvers <dns_servers...>
	eab       <key_id> <mac_key>
	on_demand
	reuse_private_keys
	client_auth {
		mode                   [request|require|verify_if_given|require_and_verify]
		trust_pool             <module>
		trusted_leaf_cert      <base64_der>
		trusted_leaf_cert_file <filename>
		verifier 			   <module>
	}
	issuer          <issuer_name>  [<params...>]
	get_certificate <manager_name> [<params...>]
	insecure_secrets_log <log_file>
}
```

- **internal** means to use Caddy's internal, locally-trusted CA to produce certificates for this site. To further configure the [`internal`](#internal) issuer, use the [`issuer`](#issuer) subdirective.

- **&lt;email&gt;** is the email address to use for the ACME account managing the site's certificates. You may prefer to use the [`email` global option](/docs/caddyfile/options#email) instead, to configure this for all your sites at once.

<aside class="tip">

Keep in mind that Let's Encrypt may send you emails about your certificate nearing expiry, but this may be misleading because Caddy may have chosen to use a different issuer (e.g. ZeroSSL) when renewing. Check your logs and/or the certificate itself (in your browser for example) to see which issuer was used, and that its expiry is still valid; if so, you may safely ignore the email from Let's Encrypt.

</aside>

- **&lt;cert_file&gt;** and **&lt;key_file&gt;** are the paths to the certificate and private key PEM files. Specifying just one is invalid.

- **protocols** <span id="protocols"/> specifies the minimum and maximum protocol versions. DO NOT change these unless you know what you're doing. Configuring this is rarely necessary, because Caddy will always use modern defaults.
  
  Default min: `tls1.2`, Default max: `tls1.3`

- **ciphers** <span id="ciphers"/> specifies the list of cipher suite names in descending preference order. DO NOT change these unless you know what you're doing. Note that cipher suites are not customizable for TLS 1.3; and not all TLS 1.2 ciphers are enabled by default. The supported names are (in order of preference by the Go stdlib):
	- `TLS_AES_128_GCM_SHA256`
	- `TLS_CHACHA20_POLY1305_SHA256`
	- `TLS_AES_256_GCM_SHA384`
	- `TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256`
	- `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256`
	- `TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384`
	- `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384`
	- `TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256`
	- `TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256`
	- `TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA`
	- `TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA`
	- `TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA`
	- `TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA`
	- `TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA`

- **curves** <span id="curves"/> specifies the list of EC curves to support. It is recommended to not change these. Supported values are:
	- `x25519`
	- `secp256r1`
	- `secp384r1`
	- `secp521r1`

- **alpn** <span id="alpn"/> is the list of values to advertise in the [ALPN extension <img src="/old/resources/images/external-link.svg" class="external-link">](https://developer.mozilla.org/en-US/docs/Glossary/ALPN) of the TLS handshake.

- **load** <span id="load"/> specifies a list of folders from which to load PEM files that are certificate+key bundles.

- **ca** <span id="ca"/> changes the ACME CA endpoint. This is most often used to set [Let's Encrypt's staging endpoint <img src="/old/resources/images/external-link.svg" class="external-link">](https://letsencrypt.org/docs/staging-environment/) when testing, or an internal ACME server. (To change this value for the whole Caddyfile, use the `acme_ca` [global option](/docs/caddyfile/options) instead.)

- **ca_root** <span id="ca_root"/> specifies a PEM file that contains a trusted root certificate for the ACME CA endpoint, if not in the system trust store.

- **key_type** <span id="key_type"/> is the type of key to use when generating CSRs. Only set this if you have a specific requirement.

- **dns** <span id="dns"/> enables the [DNS challenge](/docs/automatic-https#dns-challenge) using the specified provider plugin, which must be plugged in from one of the [`caddy-dns` <img src="/old/resources/images/external-link.svg" class="external-link">](https://github.com/caddy-dns) repositories. Each provider plugin may have their own syntax following their name; refer to their docs for details. Maintaining support for each DNS provider is a community effort. [Learn how to enable the DNS challenge for your provider at our wiki.](https://caddy.community/t/how-to-use-dns-provider-modules-in-caddy-2/8148)

- **propagation_timeout** <span id="propagation_timeout"/> is a [duration value](/docs/conventions#durations) that sets the maximum time to wait for the DNS TXT records to appear when using the DNS challenge. Set to `-1` to disable propagation checks. Default 2 minutes.

- **propagation_delay** <span id="propagation_delay"/> is a [duration value](/docs/conventions#durations) that sets how long to wait before starting DNS TXT records propagation checks when using the DNS challenge. Default `0` (no wait).

- **dns_ttl** <span id="dns_ttl"/> is a [duration value](/docs/conventions#durations) that sets the TTL of the `TXT` record used for the DNS challenge. Rarely needed.

- **dns_challenge_override_domain** <span id="dns_challenge_override_domain"/> overrides the domain to use for the DNS challenge. This is to delegate the challenge to a different domain.

  You may want to use this if your primary domain's DNS provider does not have a [DNS plugin <img src="/old/resources/images/external-link.svg" class="external-link">](https://github.com/caddy-dns) available. You can instead add a `CNAME` record with subdomain `_acme-challenge` to your primary domain, pointing to a secondary domain for which you _do_ have a plugin. This option _does not_ require special support from the plugin.
  
  When ACME issuers try to solve the DNS challenge for your primary domain, they will then follow the `CNAME` to your secondary domain to find the `TXT` record.

  **Note:** Use full canonical name from the CNAME record as value here - `_acme-challenge` subdomain won't be prepended automatically.

- **resolvers** <span id="resolvers"/> customizes the DNS resolvers used when performing the DNS challenge; these take precedence over system resolvers or any default ones. If set here, the resolvers will propagate to all configured certificate issuers.

  This is typically a list of IP addresses. For example, to use [Google Public DNS <img src="/old/resources/images/external-link.svg" class="external-link">](https://developers.google.com/speed/public-dns):

  ```caddy-d
  resolvers 8.8.8.8 8.8.4.4
  ```

- **eab** <span id="eab"/> configures ACME external account binding (EAB) for this site, using the key ID and MAC key provided by your CA.

- **on_demand** <span id="on_demand"/> enables [On-Demand TLS](/docs/automatic-https#on-demand-tls) for the hostnames given in the site block's address(es). **Security warning:** Doing so in production is insecure unless you also configure the [`on_demand_tls` global option](/docs/caddyfile/options#on-demand-tls) to mitigate abuse.

- **reuse_private_keys** <span id="reuse_private_keys"/> enables reuse of private keys when renewing certificates. By default, a new key is created for every new certificate to mitigate pinning and reduce the scope of key compromise. Key pinning is against industry best practices. This option is not recommended unless you have a specific reason to use it; this may be subject to removal in a future version.

- **client_auth** <span id="client_auth"/> enables and configures TLS client authentication:
  - **mode** <span id="mode"/> is the mode for authenticating the client. Allowed values are:

    | Mode | Description |
    | --- | --- |
    | request | Ask clients for a certificate, but allow even if there isn't one; do not verify it |
    | require | Require clients to present a certificate, but do not verify it |
    | verify_if_given | Ask clients for a certificate; allow even if there isn't one, but verify it if there is |
    | require_and_verify | Require clients to present a valid certificate that is verified |

    Default: `require_and_verify` if any `trusted_ca_cert` or `trusted_leaf_cert` are provided; otherwise, `require`.
	
  - **trust_pool** <span id="trust_pool"/> configures the source of certificate authorities (CA) providing certificates against which to validate client certificates.
	
	The certificate authority used providing the pool of trusted certificates and the configuration within the segment depends on the configured source of trust pool module. The standard modules available in Caddy are [listed below](#trust-pool-providers). The full list of modules, including 3rd-party, is listed in the [`trust_pool` JSON documentation](/docs/json/apps/http/servers/tls_connection_policies/client_authentication/#trust_pool).

  - **trusted_leaf_cert** <span id="trusted_leaf_cert"/> is a base64 DER-encoded client leaf certificate to accept.

  - **trusted_leaf_cert_file** <span id="trusted_leaf_cert_file"/> is a path to a PEM CA certificate file against which to validate client certificates.

    Multiple `trusted_*` directives may be used to specify multiple CA or leaf certificates. Client certificates which are not listed as one of the leaf certificates or signed by any of the specified CAs will be rejected according to the **mode**.

  - **verifier** <span id="verifier"/> enables the use of a custom client certificate verifier module. These can perform custom client authentication checks, such as ensuring the certificate is not revoked.

- **issuer** <span id="issuer"/> configures a custom certificate issuer, or a source from which to obtain certificates.

  Which issuer is used and the options that follow in this segment depend on the [issuer modules](#issuers) that are available. Some of the other subdirectives such as `ca` and `dns` are actually shortcuts for configuring the `acme` issuer (and this subdirective was added later), so specifying this directive and some of the others is confusing and thus prohibited.
  
  This subdirective can be specified multiple times to configure multiple, redundant issuers; if one fails to issue a cert, the next one will be tried.

- **get_certificate** <span id="get_certificate"/> enables getting certificates from a [manager module](#certificate-managers) at handshake-time.

- **insecure_secrets_log** <span id="insecure_secrets_log"/> enables logging of TLS secrets to a file. This is also known as `SSLKEYLOGFILE`. Uses NSS key log format, which can then be parsed by Wireshark or other tools. ⚠️ **Security Warning:** This is insecure as it allows other programs or tools to decrypt TLS connections, and therefore completely compromises security. However, this capability can be useful for debugging and troubleshooting.

### Trust Pool Providers

These are the standard trust pool providers that can be used in the `trust_pool` subdirective:

#### inline

The `inline` module parses the trusted root certificates as listed in the Caddyfile directly in base64 DER-encoded format. The `trust_der` directive may be repeated multiple times.

```caddy-d
trust_pool inline {
	trust_der      <base64_der>
}
```

- **trust_der** <span id="trust_der"/> is a base64 DER-encoded CA certificate against which to validate client certificates.

#### file

The `file` module reads the trusted root certificates from PEM files from disk. The `pem_file` directive can accept multiple file paths on the same line and may be repeated multiple times.

```caddy-d
... file [<pem_file>...] {
	pem_file <pem_file>...
}
```

- **pem_file** <span id="pem_file"/> is a path to a PEM CA certificate file against which to validate client certificates.

#### pki_root

The `pki_root` module obtains the _root_ and trusts certificates from the certificate authority defined in the [PKI app](/docs/caddyfile/options#pki-options). The `authority` directive can accept multiple authorities at the same time and may be repeated multiple times.

```caddy-d
... pki_root [<ca_name>...] {
	authority <ca_name>...
}
```

- **authority** <span id="authority"/> is the name of the certificate authority configured in the PKI app.

#### pki_intermediate

The `pki_intermediate` module obtains the _intermediate_ and trusts certificates from the certificate authority defined in the [PKI app](/docs/caddyfile/options#pki-options). The `authority` directive can accept multiple authorities at the same time and may be repeated multiple times.

```caddy-d
... pki_intermediate [<ca_name>...] {
	authority <ca_name>...
}
```

- **authority** <span id="authority"/> is the name of the certificate authority configured in the PKI app.

#### storage

The `storage` module extracts the trusted certificates root from Caddy [storage](/docs/caddyfile/options#storage). The `authority` directive can accept multiple authorities at the same time and may be repeated multiple times.

```caddy-d
... storage [<storage_keys>...] {
	storage <storage_module>
	keys    <storage_keys>...
}
```

- **storage** <span id="storage"/> is an optional storage module to use. If not specified, the default storage module will be used. If specified, it may be specified only once.

- **keys** <span id="keys"/> is the list of storage keys at which the PEM files of the certificates are stored. The directive accepts multiple values on the same line and may be specified multiple times.

#### http

The `http` module obtains the trusted certificates from HTTP endpoints. The `endpoints` directive can accept multiple endpoints at the same time and may be repeated multiple times.

```caddy-d
... http [<endpoints...>] {
	endpoints   <endpoints...>
	tls         <tls_config>
}
```

- **endpoints** <span id="endpoints"/> is the list of HTTP endpoints from which to obtain certificates. The directive accepts multiple values on the same line and may be specified multiple times.

- **tls** <span id="tls"/> is an optional TLS configuration to use when connecting to the HTTP endpoint. The segment parsing is defined in the [following section](#tls-1).

##### TLS

```caddy-d
... {
	ca                    <ca_module>
	insecure_skip_verify
	handshake_timeout     <duration>
	server_name           <name>
	renegotiation         <never|once|freely>
}
```

- **ca** <span id="ca"/> is an optional directive to define the provider of trust pool. The configuration follows the same behavior of [`trust_pool`](#trust_pool). If specified, it may be specified only once.

- **insecure_skip_verify** <span id="insecure_skip_verify"/> turns off TLS handshake verification, making the connection insecure and vulnerable to man-in-the-middle attacks. _Do not use in production._ The verification is done against either the certificate authorities trusted by the system or as determined by the [`ca`](#ca) directive.

- **handshake_timeout** <span id="handshake_timeout"/> is the maximum [duration](/docs/conventions#durations) to wait for the TLS handshake to complete. Default: No timeout..

- **server_name** <span id="server_name"/> sets the server name used when verifying the certificate received in the TLS handshake. By default, this will use the upstream address' host part.

- **renegotiation** <span id="renegotiation"/> sets the TLS renegotiation level. TLS renegotiation is the act of performing subsequent handshakes after the first. The level may be one of:
  - `never` (the default) disables renegotiation.
  - `once` allows a remote server to request renegotiation once per connection.
  - `freely` allows a remote server to repeatedly request renegotiation.

### Issuers

These issuers come standard with the `tls` directive:

#### acme

Obtains certificates using the ACME protocol. Note that `acme` is a default issuer (using Let's Encrypt), so configuring it explicitly is usually unnecessary.

```caddy-d
... acme [<directory_url>] {
	dir      <directory_url>
	test_dir <test_directory_url>
	email    <email>
	timeout  <duration>
	disable_http_challenge
	disable_tlsalpn_challenge
	alt_http_port    <port>
	alt_tlsalpn_port <port>
	eab <key_id> <mac_key>
	trusted_roots <pem_files...>
	dns <provider_name> [<options>]
	propagation_timeout <duration>
	propagation_delay   <duration>
	dns_ttl             <duration>
	dns_challenge_override_domain <domain>
	resolvers <dns_servers...>
	preferred_chains [smallest] {
		root_common_name <common_names...>
		any_common_name  <common_names...>
	}
}
```

- **dir** <span id="dir"/> is the URL to the ACME CA's directory.
  
  Default: `https://acme-v02.api.letsencrypt.org/directory`

- **test_dir** <span id="test_dir"/> is an optional fallback directory to use when retrying challenges; if all challenges fail, this endpoint will be used during retries; useful if a CA has a staging endpoint where you want to avoid rate limits on their production endpoint.

  Default: `https://acme-staging-v02.api.letsencrypt.org/directory`

- **email** <span id="email"/> is the ACME account contact email address.

- **timeout** <span id="timeout"/> is a [duration value](/docs/conventions#durations) that sets how long to wait before timing out an ACME operation.

- **disable_http_challenge** <span id="disable_http_challenge"/> will disable the HTTP challenge.

- **disable_tlsalpn_challenge** <span id="disable_tlsalpn_challenge"/> will disable the TLS-ALPN challenge.

- **alt_http_port** <span id="alt_http_port"/> is an alternate port on which to serve the HTTP challenge; it has to happen on port 80 so you must forward packets to this alternate port.

- **alt_tlsalpn_port** <span id="alt_tlsalpn_port"/> is an alternate port on which to serve the TLS-ALPN challenge; it has to happen on port 443 so you must forward packets to this alternate port.

- **eab** <span id="eab"/> specifies an External Account Binding which may be required with some ACME CAs.

- **trusted_roots** <span id="trusted_roots"/> is one or more root certificates (as PEM filenames) to trust when connecting to the ACME CA server.

- **dns** <span id="dns"/> configures the DNS challenge.

- **propagation_timeout** <span id="propagation_timeout"/> is a [duration value](/docs/conventions#durations) that sets the maximum time to wait for the DNS TXT records to appear when using the DNS challenge. Set to `-1` to disable propagation checks. Default 2 minutes.

- **propagation_delay** <span id="propagation_delay"/> is a [duration value](/docs/conventions#durations) that sets how long to wait before starting DNS TXT records propagation checks when using the DNS challenge. Default 0 (no wait).

- **dns_ttl** <span id="dns_ttl"/> is a [duration value](/docs/conventions#durations) that sets the TTL of the `TXT` record used for the DNS challenge. Rarely needed.

- **dns_challenge_override_domain** <span id="dns_challenge_override_domain"/> overrides the domain to use for the DNS challenge. This is to delegate the challenge to a different domain.

  You may want to use this if your primary domain's DNS provider does not have a [DNS plugin <img src="/old/resources/images/external-link.svg" class="external-link">](https://github.com/caddy-dns) available. You can instead add a `CNAME` record with subdomain `_acme-challenge` to your primary domain, pointing to a secondary domain for which you _do_ have a plugin. This option _does not_ require special support from the plugin.
  
  When ACME issuers try to solve the DNS challenge for your primary domain, they will then follow the `CNAME` to your secondary domain to find the `TXT` record.

  **Note:** Use full canonical name from the CNAME record as value here - `_acme-challenge` subdomain won't be prepended automatically.

- **resolvers** <span id="resolvers"/> customizes the DNS resolvers used when performing the DNS challenge; these take precedence over system resolvers or any default ones. If set here, the resolvers will propagate to all configured certificate issuers.

  This is typically a list of IP addresses. For example, to use [Google Public DNS <img src="/old/resources/images/external-link.svg" class="external-link">](https://developers.google.com/speed/public-dns):

  ```caddy-d
  resolvers 8.8.8.8 8.8.4.4
  ```

- **preferred_chains** <span id="preferred_chains"/> specifies which certificate chains Caddy should prefer; useful if your CA provides multiple chains. Use one of the following options:
	- **smallest** <span id="smallest"/> will tell Caddy to prefer chains with the fewest amount of bytes.

	- **root_common_name** <span id="root_common_name"/> is a list of one or more common names; Caddy will choose the first chain that has a root that matches with at least one of the specified common names.

	- **any_common_name** <span id="any_common_name"/> is a list of one or more common names; Caddy will choose the first chain that has an issuer that matches with at least one of the specified common names.


#### zerossl

Obtains certificates using the ACME protocol, specifically with ZeroSSL. Note that `zerossl` is a default issuer, so configuring it explicitly is usually unnecessary.

```caddy-d
... zerossl [<api_key>] {
	...
}
```

The syntax for `zerossl` is exactly the same as for [`acme`](#acme), except that its name is `zerossl` and it can optionally take your ZeroSSL API key.

Its functionality is also the same, except that it will use ZeroSSL's directory by default and it can automatically negotiate EAB credentials (whereas with the `acme` issuer, you have to manually provide EAB credentials and set the directory endpoint).

When explicitly configuring `zerossl`, configuring an `email` is required so that your certificates can appear in your ZeroSSL dashboard.

#### internal

Obtains certificates from an internal certificate authority.

```caddy-d
... internal {
	ca       <name>
	lifetime <duration>
	sign_with_root
}
```

- **ca** <span id="ca"/> is the name of the internal CA to use. Default: `local`. See the [PKI app global options](/docs/caddyfile/options#pki-options) to configure the `local` CA, or to create alternate CAs.

  By default, the root CA certificate has a `3600d` lifetime (10 years) and the intermediate has a `7d` lifetime (7 days).

  Caddy will attempt to install the root CA certificate to the system trust store, but this may fail when Caddy is running as an unprivileged user, or when running in a Docker container. In that case, the root CA certificate will need to be manually installed, either by using the [`caddy trust`](/docs/command-line#caddy-trust) command, or by [copying out of the container](/docs/running#usage).

- **lifetime** <span id="lifetime"/> is a [duration value](/docs/conventions#durations) that sets the validity period for interally issued leaf certificates. Default: `12h`. It is NOT recommended to change this, unless absolutely necessary. It must be shorter than the intermediate's lifetime.

- **sign_with_root** <span id="sign_with_root"/> forces the root to be the issuer instead of the intermediate. This is NOT recommended and should only be used when devices/clients do not properly validate certificate chains (very uncommon).



### Certificate Managers

Certificate manager modules are distinct from issuer modules in that use of manager modules implies that an external tool or service is keeping the certificate renewed, whereas an issuer module implies that Caddy itself is managing the certificate. (Issuer modules take a Certificate Signing Request (CSR) as input, but certificate manager modules take a TLS ClientHello as input.)

These manager modules come standard with the `tls` directive:

#### tailscale

Get certificates from a locally-running [Tailscale <img src="/old/resources/images/external-link.svg" class="external-link">](https://tailscale.com) instance. [HTTPS must be enabled in your Tailscale account](https://tailscale.com/kb/1153/enabling-https/) (or your open source [Headscale server <img src="/old/resources/images/external-link.svg" class="external-link">](https://github.com/juanfont/headscale)); and the Caddy process must either be running as root, or you must configure `tailscaled` to give your Caddy user [permission to fetch certificates](https://github.com/caddyserver/caddy/pull/4541#issuecomment-1021568348).

_**NOTE: This is usually unnecessary!** Caddy automatically uses Tailscale for all `*.ts.net` domains without any extra configuration._

```caddy-d
get_certificate tailscale  # often unnecessary!
```


#### http

Get certificates by making an HTTP(S) request. The response must have a `200` status code and the body must contain a PEM chain including the full certificate (with intermediates) as well as the private key.

```caddy-d
get_certificate http <url>
```

- **url** <span id="url"/> is the fully-qualified URL to which to make the request. It is strongly advised that this be a local endpoint for performance reasons. The URL will be augmented with the following query string parameters: 

  - `server_name`: SNI value
  - `signature_schemes`: comma-separated list of hex IDs of signature algorithms
  - `cipher_suites`: comma-separated list of hex IDS of cipher suites



## Examples

Use a custom certificate and key. The certificate should have [SANs](https://en.wikipedia.org/wiki/Subject_Alternative_Name) that match the site address:

```caddy
example.com {
	tls cert.pem key.pem
}
```

Use [locally-trusted](/docs/automatic-https#local-https) certificates for all hosts on the current site block, rather than public certificates via ACME / Let's Encrypt (useful in dev environments):

```caddy
example.com {
	tls internal
}
```

Use locally-trusted certificates, but managed [On-Demand](/docs/automatic-https#on-demand-tls) instead of in the background. This allows you to point any domain at your Caddy instance and have it automatically provision a certificate for you. This SHOULD NOT be used if your Caddy instance is publicly accessible, since an attacker could use it to exhaust your server's resources:

```caddy
https:// {
	tls internal {
		on_demand
	}
}
```

Use custom options for the internal CA (cannot use the `tls internal` shortcut):

```caddy
example.com {
	tls {
		issuer internal {
			ca foo
		}
	}
}
```

Specify an email address for your ACME account (but if only one email is used for all sites, we recommend the `email` [global option](/docs/caddyfile/options) instead):

```caddy
example.com {
	tls your@email.com
}
```

Enable the DNS challenge for a domain managed on Cloudflare with account credentials in an environment variable. This unlocks wildcard certificate support, which requires DNS validation:

```caddy
*.example.com {
	tls {
		dns cloudflare {env.CLOUDFLARE_API_TOKEN}
	}
}
```

Get the certificate chain via HTTP, instead of having Caddy manage it. Note that [`get_certificate`](#certificate-managers) implies [`on_demand`](#on_demand) is enabled, fetching certificates using a module instead of triggering ACME issuance:

```caddy
https:// {
	tls {
		get_certificate http http://localhost:9007/certs
	}
}
```

Enable TLS Client Authentication and require clients to present a valid certificate that is verified against all the provided CA's via `trusted_ca_cert_file`

```caddy
example.com {
	tls {
		client_auth {
			mode                 require_and_verify
			trusted_ca_cert_file ../caddy.ca.cer
			trusted_ca_cert_file ../root.ca.cer
		}
	}
}
```
