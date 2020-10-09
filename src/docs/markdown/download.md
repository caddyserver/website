---
title: "Download Caddy"
---

# Download Caddy

All our [official distributions](https://github.com/caddyserver/dist) come with only the standard modules. If you need third-party plugins, [build from source with xcaddy](/docs/build#xcaddy).



## Static binaries

You can **[download Caddy from GitHub](https://github.com/caddyserver/caddy/releases)**, where new releases are immediately published, and place it in your PATH.

Using `curl`:

<pre><code class="cmd"><span class="bash">curl -OL "https://github.com/caddyserver/caddy/releases/latest/download/ASSET"</span></code></pre>

Using `wget`:

<pre><code class="cmd"><span class="bash">wget "https://github.com/caddyserver/caddy/releases/latest/download/ASSET"</span></code></pre>


Replace `ASSET` with the filename for your platform.


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


## Linux & Raspberry Pi

You can use Webi to automate the processes of downloading the latest release and putting it
in your PATH, without requiring admin permissions.

<pre><code class="cmd bash">curl -sS https://webinstall.dev/caddy | bash</code></pre>

If you'd like a simple way to launch Caddy as a system service and bind to privilege ports,
see the Webi [Caddy Cheat Sheet](https://webinstall.dev/caddy).

To allow non-root users to bind to ports 80 and 443, use setcap.

<pre><code class="cmd bash">sudo setcap cap_net_bind_service=+ep $(readlink $(command -v caddy))</code></pre>


## DigitalOcean

[**Deploy a Caddy droplet on DigitalOcean**](https://marketplace.digitalocean.com/apps/caddy)


## macOS

**Homebrew**

<pre><code class="cmd bash">brew install caddy</code></pre>

[**View the Homebrew formula**](https://formulae.brew.sh/formula/caddy)

**Webi**

<pre><code class="cmd bash">curl -sS https://webinstall.dev/caddy | bash</code></pre>

[**View the Webi installer**](https://github.com/webinstall/webi-installers/tree/master/caddy)

## Windows 10

<pre><code class="cmd pwsh">curl.exe -A MS https://webinstall.dev/caddy | powershell</code></pre>

You may need to adjust the Windows firewall rules to allow non-localhost incoming connections.
