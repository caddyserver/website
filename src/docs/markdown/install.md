---
title: "Install"
---

# Install

Caddy is available for every platform as a [static binary](https://github.com/caddyserver/caddy/releases) (it has no dependencies). You can also [build from source](#build-from-source) to customize your build.


## Official packages

We maintain [official distributions](https://github.com/caddyserver/dist) for the following platforms:

- **DigitalOcean**
[Create a Caddy droplet](https://marketplace.digitalocean.com/apps/caddy) and get started in 90 seconds.

- **Fedora, RedHat, CentOS**
Read how to [install the Caddy COPR](https://copr.fedorainfracloud.org/coprs/g/caddy/caddy/).

- **Docker**
[docker pull caddy/caddy](https://hub.docker.com/r/caddy/caddy)


## Manually installing as a Linux service

Requirements:

- A `caddy` binary that you downloaded or built from source
- Systemd version 232 or newer
- Superuser rights

Move the `caddy` binary into your `$PATH`, for example:
<pre><code class="cmd bash">sudo mv caddy /usr/bin/</code></pre>

Test that it worked:
<pre><code class="cmd bash">caddy version</code></pre>

Create a group named `caddy`:
<pre><code class="cmd bash">groupadd --system caddy</code></pre>

Create a user named `caddy`, with a writeable home folder:
<pre><code class="cmd bash">useradd --system \
	--gid caddy \
	--create-home \
	--home-dir /var/lib/caddy \
	--shell /usr/sbin/nologin \
	--comment "Caddy web server" \
	caddy</code></pre>

Next, take [this systemd unit file](https://github.com/caddyserver/dist/blob/master/init/caddy.service) and save it to `/etc/systemd/system/caddy.service`. Double-check the **ExecStart** and **ExecReload** directives---make sure the binary's location and command line arguments are correct for your installation.

Double-check that both your systemd and Caddy configs are correct before continuing. Make sure your config file is in the location specified in the command.

To start the service for the first time, do the usual systemctl dance:

<pre><code class="cmd"><span class="bash">sudo systemctl daemon-reload</span>
<span class="bash">sudo systemctl enable caddy</span>
<span class="bash">sudo systemctl start caddy</span></code></pre>

Verify that it is running:
<pre><code class="cmd bash">systemctl status caddy</code></pre>

When running with our official service file, Caddy's output will be redirected to `journalctl`:
<pre><code class="cmd bash">journalctl -u caddy</code></pre>

To gracefully apply any changes to your config file (if using one):
<pre><code class="cmd bash">sudo systemctl reload caddy</code></pre>

You can stop the service with:
<pre><code class="cmd bash">sudo systemctl stop caddy</code></pre>

## Build from source

Requirements:

- [Go](https://golang.org/dl) 1.14 or newer
- [Go modules](https://github.com/golang/go/wiki/Modules) enabled

Download the `v2` branch source code:

<pre><code class="cmd bash">git clone -b v2 "https://github.com/caddyserver/caddy.git"</code></pre>

Build:

<pre><code class="cmd"><span class="bash">cd caddy/cmd/caddy/</span>
<span class="bash">go build</span></code></pre>
