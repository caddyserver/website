---
title: Verifying Asset Signatures
---

# Signature Verification

Artifact signing allows you to validate the artifact you have is the same one created by the project's workflow and was not modified by an unauthorized party (e.g. man-in-the-middle). The validation provides common ground, assurance, and knowledge that all parties are referring to the same artifact, collection of bytes, whether it is an executable, SBOM, or text file.

As of Caddy v2.6.0, CI/CD release artifacts are signed using project [Sigstore](https://www.sigstore.dev/) technology, which issues certificates containing details about the subject to whom the certificate is issued. You can start by inspecting the certificate used to sign your artifact of choice. The certificates are base64-encoded, so you first have to base64-decode it to receive the PEM file. In this example, we'll work with the `caddy_2.6.0_checksums.txt` artifact and assume a Linux-like environment.

Start by downloading the the 3 files pertaining to your artifact of choice (i.e. `<the artifact>` which is the actual artifact whose companion signature and certs are to be verified, `<the artifact>.sig` which is the signature of the artifact, and `<the artifact>.pem` is the certificate descending from the root cert by Fulcio by Sigstore). Then base64 decode the downloaded `.pem` file to the armored version:

<pre><code class="cmd bash">base64 -d < caddy_2.6.0_checksums.txt.pem > cert.pem</code></pre>

You can now inspect the certificate using the `openssl` command. Running `openssl x509 -in cert.pem -text` against the certificate we have just decoded shows this snipped print-out:


<pre><code class="cmd"><span class="bash">openssl x509 -in cert.pem -text</span>
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            22:b0:45:9d:ad:d7:54:98:67:66:b7:de:31:01:ef:4a:02:ab:fb:60
    Signature Algorithm: ecdsa-with-SHA384
        Issuer: O=sigstore.dev, CN=sigstore-intermediate
        Validity
            Not Before: Sep 20 17:17:06 2022 GMT
            Not After : Sep 20 17:27:06 2022 GMT
        Subject:
        Subject Public Key Info:
            Public Key Algorithm: id-ecPublicKey
                Public-Key: (256 bit)
                pub:
                    04:22:ee:f6:b1:85:1c:de:cf:90:1d:91:75:36:c4:
                    82:9d:54:5e:f3:a6:5b:3f:18:89:8a:0b:de:d8:93:
                    7c:02:40:39:00:d4:4e:19:0b:30:93:cc:a4:d0:df:
                    35:f7:b1:08:24:89:cf:3a:38:06:ff:92:75:06:84:
                    b5:9e:25:8c:9a
                ASN1 OID: prime256v1
                NIST CURVE: P-256
        X509v3 extensions:
            X509v3 Key Usage: critical
                Digital Signature
            X509v3 Extended Key Usage:
                Code Signing
            X509v3 Subject Key Identifier:
                3B:C0:D1:D2:C8:BA:2D:55:95:1F:68:78:DC:C6:2C:D9:B5:17:0E:EA
            X509v3 Authority Key Identifier:
                keyid:DF:D3:E9:CF:56:24:11:96:F9:A8:D8:E9:28:55:A2:C6:2E:18:64:3F

            X509v3 Subject Alternative Name: critical
                URI:https://github.com/caddyserver/caddy/.github/workflows/release.yml@refs/tags/v2.6.0
            1.3.6.1.4.1.57264.1.1:
                https://token.actions.githubusercontent.com
            1.3.6.1.4.1.57264.1.2:
                push
            1.3.6.1.4.1.57264.1.3:
                821a08a6e39ed0e7c43b0271ccf126c194eb6339
            1.3.6.1.4.1.57264.1.4:
                Release
            1.3.6.1.4.1.57264.1.5:
                caddyserver/caddy
            1.3.6.1.4.1.57264.1.6:
                refs/tags/v2.6.0
            1.3.6.1.4.1.11129.2.4.2:
                .z.x.v..`..(R.hE..k'..Eg...=.8.m..".6or....[.DS.....G0E.!..>MD.a..B.p..^..P*...um.....X..F. NYy.....#...TWIZ...y..qa....4P..
    Signature Algorithm: ecdsa-with-SHA384
         30:66:02:31:00:be:b3:3c:15:56:78:64:c6:0f:bc:48:69:a9:
         0a:27:cd:4d:92:39:00:50:42:a8:2a:ad:11:4d:64:f2:61:35:
         ec:08:e9:b5:6a:14:1b:f6:c1:0e:46:ee:a0:54:08:26:e1:02:
         31:00:a7:6d:97:db:4c:c8:dd:47:13:3d:28:7a:a6:f3:64:50:
         2c:5a:9d:9d:10:d0:cf:6f:d0:e9:37:76:fd:cc:8e:9d:c3:6b:
         ba:78:07:40:6a:40:d6:db:f6:97:d5:6a:36:9d
-----BEGIN CERTIFICATE-----
MIIDlDCCAxmgAwIBAgIUIrBFna3XVJhnZrfeMQHvSgKr+2AwCgYIKoZIzj0EAwMw
NzEVMBMGA1UEChMMc2lnc3RvcmUuZGV2MR4wHAYDVQQDExVzaWdzdG9yZS1pbnRl
cm1lZGlhdGUwHhcNMjIwOTIwMTcxNzA2WhcNMjIwOTIwMTcyNzA2WjAAMFkwEwYH
KoZIzj0CAQYIKoZIzj0DAQcDQgAEIu72sYUc3s+QHZF1NsSCnVRe86ZbPxiJigve
2JN8AkA5ANROGQswk8yk0N8197EIJInPOjgG/5J1BoS1niWMmqOCAjgwggI0MA4G
A1UdDwEB/wQEAwIHgDATBgNVHSUEDDAKBggrBgEFBQcDAzAdBgNVHQ4EFgQUO8DR
0si6LVWVH2h43MYs2bUXDuowHwYDVR0jBBgwFoAU39Ppz1YkEZb5qNjpKFWixi4Y
ZD8wYQYDVR0RAQH/BFcwVYZTaHR0cHM6Ly9naXRodWIuY29tL2NhZGR5c2VydmVy
L2NhZGR5Ly5naXRodWIvd29ya2Zsb3dzL3JlbGVhc2UueW1sQHJlZnMvdGFncy92
Mi42LjAwOQYKKwYBBAGDvzABAQQraHR0cHM6Ly90b2tlbi5hY3Rpb25zLmdpdGh1
YnVzZXJjb250ZW50LmNvbTASBgorBgEEAYO/MAECBARwdXNoMDYGCisGAQQBg78w
AQMEKDgyMWEwOGE2ZTM5ZWQwZTdjNDNiMDI3MWNjZjEyNmMxOTRlYjYzMzkwFQYK
KwYBBAGDvzABBAQHUmVsZWFzZTAfBgorBgEEAYO/MAEFBBFjYWRkeXNlcnZlci9j
YWRkeTAeBgorBgEEAYO/MAEGBBByZWZzL3RhZ3MvdjIuNi4wMIGKBgorBgEEAdZ5
AgQCBHwEegB4AHYACGCS8ChS/2hF0dFrJ4ScRWcYrBY9wzjSbea8IgY2b3IAAAGD
W+dEUwAABAMARzBFAiEAnD5NRKZhFLhCHHDIzV6bwVAqlYP6dW0CwKWDo1jzmEYC
IE5ZeeK14oi6I+7z2VRXSVq4/r15GAFxYaCMFrI0UOjjMAoGCCqGSM49BAMDA2kA
MGYCMQC+szwVVnhkxg+8SGmpCifNTZI5AFBCqCqtEU1k8mE17AjptWoUG/bBDkbu
oFQIJuECMQCnbZfbTMjdRxM9KHqm82RQLFqdnRDQz2/Q6Td2/cyOncNrungHQGpA
1tv2l9VqNp0=
-----END CERTIFICATE-----
</code></pre>

<aside class="tip" id="x509-extensions">

Notice the stated intended usage of the certificate, which is `Code Signing`. The certificate also contains the URI of the triggering Github Actions workflow in the `X509v3 Subject Alternative Name` extension, GHA workflow name in `1.3.6.1.4.1.57264.1.4`, the commit to be signed in `1.3.6.1.4.1.57264.1.3`, the repo name in `1.3.6.1.4.1.57264.1.5`, and the triggering ref `1.3.6.1.4.1.57264.1.6`. Those details together pinpoint the single event in the universe for which the certificate is to be used.

</aside>

Now that we have the certificate, we can use `cosign` cli to validate the signature. We run the following command (notice it uses the undecoded cert):

<pre><code class="cmd"><span class="bash">COSIGN_EXPERIMENTAL=1 cosign verify-blob --certificate ./caddy_2.6.0_checksums.txt.pem --signature ./caddy_2.6.0_checksums.txt.sig ./caddy_2.6.0_checksums.txt</span>
tlog entry verified with uuid: 04deb84e5a73ba75ea69092c6d700eaeb869c29cae3e0cf98dbfef871361ed09 index: 3618623
Verified OK
</code></pre>

Let's switch cli tools now and use `rekor-cli`, which interacts with the pubic Rekor server storing the transparency logs. Let's run:

<pre><code class="cmd bash">rekor-cli get --uuid 04deb84e5a73ba75ea69092c6d700eaeb869c29cae3e0cf98dbfef871361ed09 --format json | jq -r '.'
</code></pre>

The use of `jq` is to prettify the output. You should see an output like this:

```json
{
  "Attestation": "",
  "AttestationType": "",
  "Body": {
    "HashedRekordObj": {
      "data": {
        "hash": {
          "algorithm": "sha256",
          "value": "508f1044ecd9f14c43c6c8986b45b90fc79f25736e2bc85c0911433ce82533f2"
        }
      },
      "signature": {
        "content": "MEUCIHGL2HP5XzcUESTxIk72FS1aNK54LesTfyo+dVhRMeduAiEAnWZDZ5Ur44Y9056vr4to2Fb9FteG53eAFotv3fUZ4h4=",
        "publicKey": {
          "content": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURsRENDQXhtZ0F3SUJBZ0lVSXJCRm5hM1hWSmhuWnJmZU1RSHZTZ0tyKzJBd0NnWUlLb1pJemowRUF3TXcKTnpFVk1CTUdBMVVFQ2hNTWMybG5jM1J2Y21VdVpHVjJNUjR3SEFZRFZRUURFeFZ6YVdkemRHOXlaUzFwYm5SbApjbTFsWkdsaGRHVXdIaGNOTWpJd09USXdNVGN4TnpBMldoY05Nakl3T1RJd01UY3lOekEyV2pBQU1Ga3dFd1lICktvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUVJdTcyc1lVYzNzK1FIWkYxTnNTQ25WUmU4NlpiUHhpSmlndmUKMkpOOEFrQTVBTlJPR1Fzd2s4eWswTjgxOTdFSUpJblBPamdHLzVKMUJvUzFuaVdNbXFPQ0FqZ3dnZ0kwTUE0RwpBMVVkRHdFQi93UUVBd0lIZ0RBVEJnTlZIU1VFRERBS0JnZ3JCZ0VGQlFjREF6QWRCZ05WSFE0RUZnUVVPOERSCjBzaTZMVldWSDJoNDNNWXMyYlVYRHVvd0h3WURWUjBqQkJnd0ZvQVUzOVBwejFZa0VaYjVxTmpwS0ZXaXhpNFkKWkQ4d1lRWURWUjBSQVFIL0JGY3dWWVpUYUhSMGNITTZMeTluYVhSb2RXSXVZMjl0TDJOaFpHUjVjMlZ5ZG1WeQpMMk5oWkdSNUx5NW5hWFJvZFdJdmQyOXlhMlpzYjNkekwzSmxiR1ZoYzJVdWVXMXNRSEpsWm5NdmRHRm5jeTkyCk1pNDJMakF3T1FZS0t3WUJCQUdEdnpBQkFRUXJhSFIwY0hNNkx5OTBiMnRsYmk1aFkzUnBiMjV6TG1kcGRHaDEKWW5WelpYSmpiMjUwWlc1MExtTnZiVEFTQmdvckJnRUVBWU8vTUFFQ0JBUndkWE5vTURZR0Npc0dBUVFCZzc4dwpBUU1FS0RneU1XRXdPR0UyWlRNNVpXUXdaVGRqTkROaU1ESTNNV05qWmpFeU5tTXhPVFJsWWpZek16a3dGUVlLCkt3WUJCQUdEdnpBQkJBUUhVbVZzWldGelpUQWZCZ29yQmdFRUFZTy9NQUVGQkJGallXUmtlWE5sY25abGNpOWoKWVdSa2VUQWVCZ29yQmdFRUFZTy9NQUVHQkJCeVpXWnpMM1JoWjNNdmRqSXVOaTR3TUlHS0Jnb3JCZ0VFQWRaNQpBZ1FDQkh3RWVnQjRBSFlBQ0dDUzhDaFMvMmhGMGRGcko0U2NSV2NZckJZOXd6alNiZWE4SWdZMmIzSUFBQUdEClcrZEVVd0FBQkFNQVJ6QkZBaUVBbkQ1TlJLWmhGTGhDSEhESXpWNmJ3VkFxbFlQNmRXMEN3S1dEbzFqem1FWUMKSUU1WmVlSzE0b2k2SSs3ejJWUlhTVnE0L3IxNUdBRnhZYUNNRnJJMFVPampNQW9HQ0NxR1NNNDlCQU1EQTJrQQpNR1lDTVFDK3N6d1ZWbmhreGcrOFNHbXBDaWZOVFpJNUFGQkNxQ3F0RVUxazhtRTE3QWpwdFdvVUcvYkJEa2J1Cm9GUUlKdUVDTVFDbmJaZmJUTWpkUnhNOUtIcW04MlJRTEZxZG5SRFF6Mi9RNlRkMi9jeU9uY05ydW5nSFFHcEEKMXR2Mmw5VnFOcDA9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K"
        }
      }
    }
  },
  "LogIndex": 3618623,
  "IntegratedTime": 1663694226,
  "UUID": "04deb84e5a73ba75ea69092c6d700eaeb869c29cae3e0cf98dbfef871361ed09",
  "LogID": "c0d23d6ad406973f9559f3ba2d1ca01f84147d8ffc5b8445c224f98b9591801d"
}
```

Notice how the value of `.Body.HashedRekordObj.signature.content` matches the content of the signature generated in our CI and available in the file `caddy_2.6.0_checksums.txt.sig`. Moreover, the certificate used and downloaded is also stored in the Rekor server and available in the response at `.Body.HashedRekordObj.signature.publicKey.content` and matches the string we have in the file `caddy_2.6.0_checksums.txt.pem`. We can take one step further and check how `.Body.HashedRekordObj.data.hash.value` matches the output of the command `sha256sum ./caddy_2.6.0_checksums.txt`. So by now we have matching certs, matching signatures, and matching checksums (of the file containing the checksums of the archives but not of itself; this checksum is provided and recorded externally via Sigstore ecosystem). All of this is publicly recorded in transparency logs for the general public to validate.

## Verifying Authenticity of an Artifact

What if you are handed an artifact claimed to be the product of the Caddy project but you were not given the signature file or the certificate? You can use `rekor-cli` to query Rekor server for the subject artifact:

<pre><code class="cmd"><span class="bash">rekor-cli search --artifact ./caddy_2.6.0_checksums.txt --format json | jq -r '.UUIDs[0]'</span>
Found matching entries (listed by UUID):
362f8ecba72f432604deb84e5a73ba75ea69092c6d700eaeb869c29cae3e0cf98dbfef871361ed09</code></pre>

Note how the UUID matches the one encountered in the earlier section for the same file. Like we did in the earlier section, we can query Rekor for the entry details of this UUID:

<pre><code class="cmd bash">rekor-cli get --uuid 04deb84e5a73ba75ea69092c6d700eaeb869c29cae3e0cf98dbfef871361ed09 --format json | jq -r '.'</code></pre>

However, we can short-circuit the lookup by running this line to merge the two separate commands into a one-liner:

<pre><code class="cmd"><span class="bash">rekor-cli get --uuid $(rekor-cli search --artifact ./caddy_2.6.0_checksums.txt --format json | jq -r '.UUIDs[0]') --format json | jq -r '.'</span>
{
  "Attestation": "",
  "AttestationType": "",
  "Body": {
    "HashedRekordObj": {
      "data": {
        "hash": {
          "algorithm": "sha256",
          "value": "508f1044ecd9f14c43c6c8986b45b90fc79f25736e2bc85c0911433ce82533f2"
        }
      },
      "signature": {
        "content": "MEUCIHGL2HP5XzcUESTxIk72FS1aNK54LesTfyo+dVhRMeduAiEAnWZDZ5Ur44Y9056vr4to2Fb9FteG53eAFotv3fUZ4h4=",
        "publicKey": {
          "content": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURsRENDQXhtZ0F3SUJBZ0lVSXJCRm5hM1hWSmhuWnJmZU1RSHZTZ0tyKzJBd0NnWUlLb1pJemowRUF3TXcKTnpFVk1CTUdBMVVFQ2hNTWMybG5jM1J2Y21VdVpHVjJNUjR3SEFZRFZRUURFeFZ6YVdkemRHOXlaUzFwYm5SbApjbTFsWkdsaGRHVXdIaGNOTWpJd09USXdNVGN4TnpBMldoY05Nakl3T1RJd01UY3lOekEyV2pBQU1Ga3dFd1lICktvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUVJdTcyc1lVYzNzK1FIWkYxTnNTQ25WUmU4NlpiUHhpSmlndmUKMkpOOEFrQTVBTlJPR1Fzd2s4eWswTjgxOTdFSUpJblBPamdHLzVKMUJvUzFuaVdNbXFPQ0FqZ3dnZ0kwTUE0RwpBMVVkRHdFQi93UUVBd0lIZ0RBVEJnTlZIU1VFRERBS0JnZ3JCZ0VGQlFjREF6QWRCZ05WSFE0RUZnUVVPOERSCjBzaTZMVldWSDJoNDNNWXMyYlVYRHVvd0h3WURWUjBqQkJnd0ZvQVUzOVBwejFZa0VaYjVxTmpwS0ZXaXhpNFkKWkQ4d1lRWURWUjBSQVFIL0JGY3dWWVpUYUhSMGNITTZMeTluYVhSb2RXSXVZMjl0TDJOaFpHUjVjMlZ5ZG1WeQpMMk5oWkdSNUx5NW5hWFJvZFdJdmQyOXlhMlpzYjNkekwzSmxiR1ZoYzJVdWVXMXNRSEpsWm5NdmRHRm5jeTkyCk1pNDJMakF3T1FZS0t3WUJCQUdEdnpBQkFRUXJhSFIwY0hNNkx5OTBiMnRsYmk1aFkzUnBiMjV6TG1kcGRHaDEKWW5WelpYSmpiMjUwWlc1MExtTnZiVEFTQmdvckJnRUVBWU8vTUFFQ0JBUndkWE5vTURZR0Npc0dBUVFCZzc4dwpBUU1FS0RneU1XRXdPR0UyWlRNNVpXUXdaVGRqTkROaU1ESTNNV05qWmpFeU5tTXhPVFJsWWpZek16a3dGUVlLCkt3WUJCQUdEdnpBQkJBUUhVbVZzWldGelpUQWZCZ29yQmdFRUFZTy9NQUVGQkJGallXUmtlWE5sY25abGNpOWoKWVdSa2VUQWVCZ29yQmdFRUFZTy9NQUVHQkJCeVpXWnpMM1JoWjNNdmRqSXVOaTR3TUlHS0Jnb3JCZ0VFQWRaNQpBZ1FDQkh3RWVnQjRBSFlBQ0dDUzhDaFMvMmhGMGRGcko0U2NSV2NZckJZOXd6alNiZWE4SWdZMmIzSUFBQUdEClcrZEVVd0FBQkFNQVJ6QkZBaUVBbkQ1TlJLWmhGTGhDSEhESXpWNmJ3VkFxbFlQNmRXMEN3S1dEbzFqem1FWUMKSUU1WmVlSzE0b2k2SSs3ejJWUlhTVnE0L3IxNUdBRnhZYUNNRnJJMFVPampNQW9HQ0NxR1NNNDlCQU1EQTJrQQpNR1lDTVFDK3N6d1ZWbmhreGcrOFNHbXBDaWZOVFpJNUFGQkNxQ3F0RVUxazhtRTE3QWpwdFdvVUcvYkJEa2J1Cm9GUUlKdUVDTVFDbmJaZmJUTWpkUnhNOUtIcW04MlJRTEZxZG5SRFF6Mi9RNlRkMi9jeU9uY05ydW5nSFFHcEEKMXR2Mmw5VnFOcDA9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K"
        }
      }
    }
  },
  "LogIndex": 3618623,
  "IntegratedTime": 1663694226,
  "UUID": "04deb84e5a73ba75ea69092c6d700eaeb869c29cae3e0cf98dbfef871361ed09",
  "LogID": "c0d23d6ad406973f9559f3ba2d1ca01f84147d8ffc5b8445c224f98b9591801d"
}
</code></pre>

We now know the artifact is signed, and its signature is logged on Rekor transparency log server. The next step is to validate the signature and the artifact were the product of the CI/CD workflow of the Caddy project. We do this by extracting the public key from the JSON received by querying Rekor, base64-decode it into PEM file, then inspect the certificate using `openssl`. Run the following command to extract the certificate from the Rekor response we received earlier, base64-decode it, and store the result in a file.

<pre>
<code class="cmd"><span class="bash">rekor-cli get --uuid $(rekor-cli search --artifact ./caddy_2.6.0_checksums.txt --format json | jq -r '.UUIDs[0]') --format json | jq -r '.Body.HashedRekordObj.signature.publicKey.content' | base64 -d > cert.pem</span></code>
</pre>

Now inspect the certificate using `openssl` and pay attention to the `X509v3 extensions` section.

<pre><code class="cmd"><span class="bash">openssl x509 -in cert.pem -text</span>
Certificate:
...
        Issuer: O=sigstore.dev, CN=sigstore-intermediate
...
        X509v3 extensions:
            X509v3 Key Usage: critical
                Digital Signature
            X509v3 Extended Key Usage:
                Code Signing
            X509v3 Subject Key Identifier:
                3B:C0:D1:D2:C8:BA:2D:55:95:1F:68:78:DC:C6:2C:D9:B5:17:0E:EA
            X509v3 Authority Key Identifier:
                keyid:DF:D3:E9:CF:56:24:11:96:F9:A8:D8:E9:28:55:A2:C6:2E:18:64:3F

            X509v3 Subject Alternative Name: critical
                URI:https://github.com/caddyserver/caddy/.github/workflows/release.yml@refs/tags/v2.6.0
            1.3.6.1.4.1.57264.1.1:
                https://token.actions.githubusercontent.com
            1.3.6.1.4.1.57264.1.2:
                push
            1.3.6.1.4.1.57264.1.3:
                821a08a6e39ed0e7c43b0271ccf126c194eb6339
            1.3.6.1.4.1.57264.1.4:
                Release
            1.3.6.1.4.1.57264.1.5:
                caddyserver/caddy
            1.3.6.1.4.1.57264.1.6:
                refs/tags/v2.6.0
            1.3.6.1.4.1.11129.2.4.2:
                .z.x.v..`..(R.hE..k'..Eg...=.8.m..".6or....[.DS.....G0E.!..>MD.a..B.p..^..P*...um.....X..F. NYy.....#...TWIZ...y..qa....4P..
   ...
</code></pre>

The [extensions values](#x509-extensions) indicate the authenticity of the artifact. Refer to [Sigstore OID information](https://github.com/sigstore/fulcio/blob/a25fb09c3f0561ac43e50357fdfc427e3f0aca4a/docs/oid-info.md) for the definition of each extension.

## What If The Signature Is Not Verified?

Signature verification failure indicates the artificate at hand was not produced by the CI/CD workflow of the Caddy project on GitHub. If you have the signature, the certificate, and the artifact, then you are looking for successful verification reported by `cosign`. Alternatively, you can use `rekor-cli` to inspect the Rekor server for the entry, validate the certificate extensions for the correct and expected values, and match the checksums and signatures. Mismatches or absence of Rekor entry means either the artifact was not produced by the CI/CD of the Caddy project, or the artifact was tampered somewhere between the build flow of the CI/CD, the GitHub releases page, and the delivery to you.
