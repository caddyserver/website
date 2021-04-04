---
title: "Install"
---

# Install

This page describes various methods for installing Caddy on your system.

**Official:**

- [Static binaries](#static-binaries)
- [Debian, Ubuntu, Raspbian](#debian-ubuntu-raspbian)
- [Fedora, RedHat, CentOS](#fedora-redhat-centos)
- [Arch Linux, Manjaro, Parabola](#arch-linux-manjaro-parabola)
- [Docker](#docker)
- [DigitalOcean](#digitalocean)
- [Linux service](#linux-service)

<aside class="tip">
    Our <a href="https://github.com/caddyserver/dist">official packages</a> come only with the standard modules. If you need third-party plugins, <a href="/docs/build#xcaddy">build from source with <code>xcaddy</code></a> or use <a href="/download">our download page</a>.
</aside>


**Community-maintained:**

- [Homebrew](#homebrew)
- [Webi](#webi)
- [Chocolatey](#chocolatey)
- [Ansible](#ansible)


## Static binaries

Simply downloading a Caddy binary does not <a href="#linux-service">install it as a service</a>, but can be useful in dev or when upgrading an existing installation.

- [**View releases on GitHub**](https://github.com/caddyserver/caddy/releases) (expand "Assets")
- [**Use our download page**](/download)


## Debian, Ubuntu, Raspbian

Installing this package automatically starts and runs Caddy for you as a systemd service named `caddy` using our official [`caddy.service`](https://github.com/caddyserver/dist/blob/master/init/caddy.service) unit file.

This package also comes with a `caddy-api` systemd service using our official [`caddy-api.service`](https://github.com/caddyserver/dist/blob/master/init/caddy-api.service) unit file, which is disabled by default. If you plan to configure Caddy solely through its [API](/docs/api), then you should disable the `caddy` service, and enable the `caddy-api` service.

Stable releases:

<pre><code class="cmd"><span class="bash">sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https</span>
<span class="bash">curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo apt-key add -</span>
<span class="bash">curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list</span>
<span class="bash">sudo apt update</span>
<span class="bash">sudo apt install caddy</span></code></pre>

Testing releases (includes betas and release candidates):

<pre><code class="cmd"><span class="bash">sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https</span>
<span class="bash">curl -1sLf 'https://dl.cloudsmith.io/public/caddy/testing/gpg.key' | sudo apt-key add -</span>
<span class="bash">curl -1sLf 'https://dl.cloudsmith.io/public/caddy/testing/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-testing.list</span>
<span class="bash">sudo apt update</span>
<span class="bash">sudo apt install caddy</span></code></pre>

[**View the Cloudsmith repos**](https://cloudsmith.io/~caddy/repos/)

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

## Arch Linux, Manjaro, Parabola

<pre><code class="cmd"><span class="bash">pacman -Syu caddy</span></code></pre>

[**View Caddy in the Arch Linux repositories**](https://archlinux.org/packages/community/x86_64/caddy/)


## Docker

<pre><code class="cmd bash">docker pull caddy</code></pre>

[**View on Docker Hub**](https://hub.docker.com/_/caddy)

## DigitalOcean

[**Deploy a Caddy droplet on DigitalOcean**](https://marketplace.digitalocean.com/apps/caddy)

## Linux service

Manually install Caddy as a service on Linux with these instructions.

**Requirements:**

- `caddy` binary that you [downloaded](/download) or [built from source](/docs/build)
- `systemctl --version` 232 or newer
- `sudo` privileges

Move the caddy binary into your `$PATH`, for example:
<pre><code class="cmd bash">sudo mv caddy /usr/bin/</code></pre>

Test that it worked:
<pre><code class="cmd bash">caddy version</code></pre>

Create a group named `caddy`:
<pre><code class="cmd bash">sudo groupadd --system caddy</code></pre>

Create a user named `caddy`, with a writeable home folder:
<pre><code class="cmd bash">sudo useradd --system \
    --gid caddy \
    --create-home \
    --home-dir /var/lib/caddy \
    --shell /usr/sbin/nologin \
    --comment "Caddy web server" \
    caddy</code></pre>

If using a config file, be sure it is readable by the `caddy` user you just created.

Next, [choose a systemd service file](https://github.com/caddyserver/dist/blob/master/init) based on your use case:

- [**`caddy.service`**](https://github.com/caddyserver/dist/blob/master/init/caddy.service) if you configure Caddy with a file.
- [**`caddy-api.service`**](https://github.com/caddyserver/dist/blob/master/init/caddy-api.service) if you configure Caddy solely through its API.

They are very similar but have minor differences in the ExecStart and ExecReload commands to accommodate your workflow. Customize the file accordingly.

**Double-check the `ExecStart` and `ExecReload` directives.** Make sure the binary's location and command line arguments are correct for your installation! For example: if using a config file, change your `--config` path if it is different from our example.

The usual place to save the service file is: `/etc/systemd/system/caddy.service`

After saving your service file, you can start the service for the first time with the usual systemctl dance:

<pre><code class="cmd"><span class="bash">sudo systemctl daemon-reload</span>
<span class="bash">sudo systemctl enable caddy</span>
<span class="bash">sudo systemctl start caddy</span></code></pre>

Verify that it is running:
<pre><code class="cmd bash">systemctl status caddy</code></pre>

When running with our official service file, Caddy's output will be redirected to `journalctl`:
<pre><code class="cmd bash">journalctl -u caddy --no-pager | less</code></pre>

If using a config file, you can gracefully apply any changes:
<pre><code class="cmd bash">sudo systemctl reload caddy</code></pre>

You can stop the service with:
<pre><code class="cmd bash">sudo systemctl stop caddy</code></pre>

<aside class="advice">
	Do not stop the service to change Caddy's configuration. Stopping the server will incur downtime. Use the reload command instead.
</aside>


## Homebrew

_Note: This is a community-maintained installation method._

<pre><code class="cmd bash">brew install caddy</code></pre>

[**View the Homebrew formula**](https://formulae.brew.sh/formula/caddy)


## Webi

_Note: This is a community-maintained installation method._

Linux and macOS:

<pre><code class="cmd bash">curl -sS https://webinstall.dev/caddy | bash</code></pre>

Windows:

<pre><code class="cmd">curl.exe -A MS https://webinstall.dev/caddy | powershell</code></pre>

You may need to adjust the Windows firewall rules to allow non-localhost incoming connections.

[**View on Webi**](https://webinstall.dev/caddy)


## Chocolatey

_Note: This is a community-maintained installation method._

<pre><code class="cmd">choco install caddy</code></pre>

[**View the Chocolatey package**](https://chocolatey.org/packages/caddy)


## Ansible

_Note: This is a community-maintained installation method._

<pre><code class="cmd bash">ansible-galaxy install nvjacobo.caddy</code></pre>

[**View the Ansible role repository**](https://github.com/nvjacobo/caddy)
