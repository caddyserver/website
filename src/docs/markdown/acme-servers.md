---
title: "List of ACME Servers"
---

# List of ACME Servers

**All known, public ACME servers.**

[Caddy 2.3 introduced the ability to configure multiple certificate issuers](https://github.com/caddyserver/caddy/pull/3862), enabling Caddy to automatically try each issuer until a certificate is obtained; this allows for true multi-CA redundancy.

By default, Caddy supports Let's Encrypt and ZeroSSL for this feature. 

```
tls {
	issuer acme
	issuer zerossl
}
```

However, there is a growing list of public ACME endpoints that can be used for this purpose by editing Caddyfile. Previously, a list was maintained at docs.HTTPS.dev; the site has since been taken offline, so this article serves to revive the list of public ACME endpoints.

All endpoints on this list are compliant with RFC 8555. Please note that different CAs have varying legal terms, pricing, and some difference in their ACME issuance policies. Consult each CA's documentation for more information.

## Publicly-trusted CAs

* [Let's Encrypt](https://letsencrypt.org)
  * Production: [https://acme-v02.api.letsencrypt.org/directory](https://acme-v02.api.letsencrypt.org/directory)
  * Test: [https://acme-staging-v02.api.letsencrypt.org/directory](https://acme-staging-v02.api.letsencrypt.org/directory)
* [ZeroSSL](https://zerossl.com/documentation/acme/)
  * Production: [https://acme.zerossl.com/v2/DV90](https://acme.zerossl.com/v2/DV90)
* [BuyPass](https://www.buypass.com/ssl/products/acme)
  * Production: [https://api.buypass.com/acme/directory](https://api.buypass.com/acme/directory)
  * Test: [https://api.test4.buypass.no/acme/directory](https://api.test4.buypass.no/acme/directory)
* [Sectigo](https://sectigo.com/resource-library/sectigos-acme-automation)
  * Production:
    * DV: [https://acme.sectigo.com/v2/DV](https://acme.sectigo.com/v2/DV)
    * OV: [https://acme.sectigo.com/v2/OV](https://acme.sectigo.com/v2/OV)
    * EV: [https://acme.sectigo.com/v2/EV](https://acme.sectigo.com/v2/EV)
* [InCommon](https://support.sectigo.com/Com_KnowledgeDetailPage?Id=kA01N000000bvYj)
  * Production:
    * OV RSA: [https://acme.sectigo.com/v2/InCommonRSAOV](https://acme.sectigo.com/v2/InCommonRSAOV)
    * OV ECC: [https://acme.sectigo.com/v2/InCommonECCO](https://acme.sectigo.com/v2/InCommonECCO)
* [SSL.com](https://www.ssl.com/guide/ssl-tls-certificate-issuance-and-revocation-with-acme/)
  * Production:
    * DV RSA: [https://acme.ssl.com/sslcom-dv-rsa](https://acme.ssl.com/sslcom-dv-rsa)
    * DV ECC: [https://acme.ssl.com/sslcom-dv-ecc](https://acme.ssl.com/sslcom-dv-ecc)
