---
title: "Download Caddy"
---

# Download Caddy

All our [official distributions](https://github.com/caddyserver/dist) come with only the standard modules. If you need third-party plugins, [build from source with xcaddy](/docs/build#xcaddy).



## Static binaries

You can **[download Caddy from GitHub](https://github.com/caddyserver/caddy/releases)**, where new releases are immediately published.

Using `curl`:

<pre><code class="cmd"><span class="bash">curl -OL "https://github.com/caddyserver/caddy/releases/latest/download/ASSET"</span></code></pre>

Using `wget`:

<pre><code class="cmd"><span class="bash">wget "https://github.com/caddyserver/caddy/releases/latest/download/ASSET"</span></code></pre>


## Docker

<pre><code class="cmd bash">docker pull caddy</code></pre>

[**View on Docker Hub**](https://hub.docker.com/_/caddy)


## Debian, Ubuntu, Raspbian

<pre><code class="cmd"><span class="bash">echo "deb [trusted=yes] https://apt.fury.io/caddy/ /" \
    | sudo tee -a /etc/apt/sources.list.d/caddy-fury.list</span>
<span class="bash">sudo apt update</span>
<span class="bash">sudo apt install caddy</span></code></pre>

Installing this package automatically starts and runs Caddy for you.


## Fedora, RedHat, CentOS

Fedora or RHEL/CentOS 8:

<pre><code class="cmd"><span class="bash">dnf install 'dnf-command(copr)'</span>
<span class="bash">dnf copr enable @caddy/caddy</span>
<span class="bash">dnf install caddy</span></code></pre>

RHEL/CentOS 7:

<pre><code class="cmd"><span class="bash">yum install yum-plugin-copr</span>
<span class="bash">yum copr enable @caddy/caddy</span>
<span class="bash">yum install caddy</span></code></pre>

[**View the Caddy COPR**](https://copr.fedorainfracloud.org/coprs/g/caddy/caddy/)


## DigitalOcean

[**Deploy a Caddy droplet on DigitalOcean**](https://marketplace.digitalocean.com/apps/caddy)

## macOS

<pre><code class="cmd bash">brew install caddy</code></pre>

[**View the Homebrew formula**](https://formulae.brew.sh/formula/caddy)
