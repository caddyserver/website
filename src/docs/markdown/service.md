---
title: Linux Service
---

Linux Service
=============

The recommended way to run Caddy on Linux distributions with systemd is with our official systemd unit files.

- [Unit Files](#unit-files)
- [Using the Service](#using-the-service)
- [Manual Installation](#manual-installation)
- [Overrides](#overrides)


## Unit Files

We provide two different systemd unit files that you can choose between, depending on your usecase:

- [**`caddy.service`**](https://github.com/caddyserver/dist/blob/master/init/caddy.service) if you configure Caddy with a [Caddyfile](/docs/caddyfile). If you prefer to use a JSON config file, you may [override](#overrides) the `ExecStart` and `ExecReload` commands.

- [**`caddy-api.service`**](https://github.com/caddyserver/dist/blob/master/init/caddy-api.service) if you configure Caddy solely through its [API](/docs/api). This service uses the [`--resume`](/docs/command-line#caddy-run) option which will start Caddy using the `autosave.json` which is [persisted](/docs/json/admin/config/) by default.

They are very similar, but differ in the `ExecStart` and `ExecReload` commands to accommodate the workflows.

If you need to switch between the services, you should disable and stop the previous one before enabling and starting the other. For example, to switch from the `caddy` service to the `caddy-api` service:
<pre><code class="cmd"><span class="bash">sudo systemctl disable --now caddy</span>
<span class="bash">sudo systemctl enable --now caddy-api</span></code></pre>


## Using the Service

To verify that the service is running:
<pre><code class="cmd bash">systemctl status caddy</code></pre>
The status command will also show the location of the currently running service file.

When running with our official service file, Caddy's output will be redirected to `journalctl`. To read your full logs and to avoid lines being truncated:
<pre><code class="cmd bash">journalctl -u caddy --no-pager | less</code></pre>

If using a config file, you can gracefully reload Caddy after making any changes:
<pre><code class="cmd bash">sudo systemctl reload caddy</code></pre>

You can stop the service with:
<pre><code class="cmd bash">sudo systemctl stop caddy</code></pre>

<aside class="advice">
	Do not stop the service to change Caddy's configuration. Stopping the server will incur downtime. Use the reload command instead.
</aside>


## Manual Installation

Some [installation methods](/docs/install) automatically set up Caddy to run as a service. If you chose a method that did not, you may follow these instructions to do so:

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

Create a user named `caddy`, with a writeable home directory:
<pre><code class="cmd bash">sudo useradd --system \
    --gid caddy \
    --create-home \
    --home-dir /var/lib/caddy \
    --shell /usr/sbin/nologin \
    --comment "Caddy web server" \
    caddy</code></pre>

If using a config file, be sure it is readable by the `caddy` user you just created.

Next, [choose a systemd unit file](#unit-files) based on your use case.

**Double-check the `ExecStart` and `ExecReload` directives.** Make sure the binary's location and command line arguments are correct for your installation! For example: if using a config file, change your `--config` path if it is different from the defaults.

The usual place to save the service file is: `/etc/systemd/system/caddy.service`

After saving your service file, you can start the service for the first time with the usual systemctl dance:

<pre><code class="cmd"><span class="bash">sudo systemctl daemon-reload</span>
<span class="bash">sudo systemctl enable --now caddy</span></code></pre>

Verify that it is running:
<pre><code class="cmd bash">systemctl status caddy</code></pre>

Now you're ready to [use the service](#using-the-service)!


## Overrides

The best way to override aspects of the service files is with this command:
<pre><code class="cmd bash">sudo systemctl edit caddy</code></pre>

This will open a blank file with your default terminal text editor in which you can override or add directives to the unit definition.

For example, if you need to define environment variables for use in your config, you may do so like this:
```systemd
[Service]
Environment="CF_API_TOKEN=super-secret-cloudflare-tokenvalue"
```

Or, for example if you need to change the config file from the default of the Caddyfile, to instead using a JSON file:
```systemd
[Service]
ExecStart=
ExecStart=/usr/bin/caddy run --environ --config /etc/caddy/caddy.json
ExecReload=
ExecReload=/usr/bin/caddy reload --config /etc/caddy/caddy.json
```

Then, save the file and exit the text editor, and restart the service for it to take effect:
<pre><code class="cmd bash">sudo systemctl restart caddy</code></pre>
