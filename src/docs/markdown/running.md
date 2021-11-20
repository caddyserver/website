---
title: Keep Caddy Running
---

# Keep Caddy Running

While Caddy can be run successfully by directly using its [Command Line Interface](/docs/command-line), there are numerous advantages to using a service manager to keep it running, such as ensuring it starts back up when the system boots, and to capture stdout/stderr logging.


- [Linux Service](#linux-service)
  - [Unit Files](#unit-files)
  - [Using the Service](#using-the-service)
  - [Manual Installation](#manual-installation)
  - [Overrides](#overrides)
- [Windows Service](#windows-service)
- [Docker Compose](#docker-compose)


## Linux Service

The recommended way to run Caddy on Linux distributions with systemd is with our official systemd unit files.


### Unit Files

We provide two different systemd unit files that you can choose between, depending on your usecase:

- [**`caddy.service`**](https://github.com/caddyserver/dist/blob/master/init/caddy.service) if you configure Caddy with a [Caddyfile](/docs/caddyfile). If you prefer to use a JSON config file, you may [override](#overrides) the `ExecStart` and `ExecReload` commands.

- [**`caddy-api.service`**](https://github.com/caddyserver/dist/blob/master/init/caddy-api.service) if you configure Caddy solely through its [API](/docs/api). This service uses the [`--resume`](/docs/command-line#caddy-run) option which will start Caddy using the `autosave.json` which is [persisted](/docs/json/admin/config/) by default.

They are very similar, but differ in the `ExecStart` and `ExecReload` commands to accommodate the workflows.

If you need to switch between the services, you should disable and stop the previous one before enabling and starting the other. For example, to switch from the `caddy` service to the `caddy-api` service:
<pre><code class="cmd"><span class="bash">sudo systemctl disable --now caddy</span>
<span class="bash">sudo systemctl enable --now caddy-api</span></code></pre>


### Using the Service

If using a Caddyfile, you can edit your configuration with `nano`, `vi`, or your preferred editor:
<pre><code class="cmd bash">sudo nano /etc/caddy/Caddyfile</code></pre>

You can place your static site files in either `/var/www/html` or `/srv`. Make sure the `caddy` user has permission to read the files.

To verify that the service is running:
<pre><code class="cmd bash">systemctl status caddy</code></pre>
The status command will also show the location of the currently running service file.

When running with our official service file, Caddy's output will be redirected to `journalctl`. To read your full logs and to avoid lines being truncated:
<pre><code class="cmd bash">journalctl -u caddy --no-pager | less +G</code></pre>

If using a config file, you can gracefully reload Caddy after making any changes:
<pre><code class="cmd bash">sudo systemctl reload caddy</code></pre>

You can stop the service with:
<pre><code class="cmd bash">sudo systemctl stop caddy</code></pre>

<aside class="advice">
	Do not stop the service to change Caddy's configuration. Stopping the server will incur downtime. Use the reload command instead.
</aside>

The Caddy process will run as the `caddy` user, which has its `$HOME` set to `/var/lib/caddy`. This means that:
- The default [data storage location](/docs/conventions#data-directory) (for certificates and other state information) will be in `/var/lib/caddy/.local/share/caddy`.
- The default [config storage location](/docs/conventions#configuration-directory) (for the auto-saved JSON config, primarily useful for the `caddy-api` service) will be in `/var/lib/caddy/.config/caddy`.


### Manual Installation

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


### Overrides

The best way to override aspects of the service files is with this command:
<pre><code class="cmd bash">sudo systemctl edit caddy</code></pre>

This will open a blank file with your default terminal text editor in which you can override or add directives to the unit definition. This is called a "drop-in" file.

For example, if you need to define environment variables for use in your config, you may do so like this:
```systemd
[Service]
Environment="CF_API_TOKEN=super-secret-cloudflare-tokenvalue"
```

Or, for example if you need to change the config file from the default of the Caddyfile, to instead using a JSON file (note that `Exec*` directives [must be reset with empty strings](https://www.freedesktop.org/software/systemd/man/systemd.service.html#ExecStart=) before setting a new value):
```systemd
[Service]
ExecStart=
ExecStart=/usr/bin/caddy run --environ --config /etc/caddy/caddy.json
ExecReload=
ExecReload=/usr/bin/caddy reload --config /etc/caddy/caddy.json
```

Then, save the file and exit the text editor, and restart the service for it to take effect:
<pre><code class="cmd bash">sudo systemctl restart caddy</code></pre>


## Windows service

Install Caddy as a service on Windows with these instructions.

**Requirements:**

- `caddy.exe` binary that you [downloaded](/download) or [built from source](/docs/build)
- Any `.exe` from the latest release of the
  [WinSW](https://github.com/winsw/winsw/releases/latest) service wrapper (the below service config is written for v2.x releases)

Put all files into a service directory. In the following examples, we use `C:\caddy`.

Rename the `WinSW-x64.exe` file to `caddy-service.exe`.

Add a `caddy-service.xml` in the same directory:

```xml
<service>
  <id>caddy</id>
  <!-- Display name of the service -->
  <name>Caddy Web Server (powered by WinSW)</name>
  <!-- Service description -->
  <description>Caddy Web Server (https://caddyserver.com/)</description>
  <executable>%BASE%\caddy.exe</executable>
  <arguments>run</arguments>
  <log mode="roll-by-time">
    <pattern>yyyy-MM-dd</pattern>
  </log>
</service>
```

You can now install the service using:
<pre><code class="cmd bash">caddy-service install</code></pre>

You might want to start the Windows Services Console to see if the service is runnnig correctly:
<pre><code class="cmd bash">services.msc</code></pre>

Be aware that Windows services cannot be reloaded, so you have to tell caddy directly to relaod:
<pre><code class="cmd bash">caddy reload</code></pre>

Restarting is possible via the normal Windows services commands, for example via the Task Manager's "Services" tab.

For customizing the service wrapper, see the [WinSW documentation](https://github.com/winsw/winsw/tree/master#usage)


## Docker Compose

The simplest way to get up and running with Docker is to use Docker Compose. _The below is only an excerpt, see the docs on [Docker Hub](https://hub.docker.com/_/caddy) for more details_.

First, create a file `docker-compose.yml` (or add this service to your existing file):

```yaml
version: "3.7"

services:
  caddy:
    image: caddy:<version>
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - $PWD/Caddyfile:/etc/caddy/Caddyfile
      - $PWD/site:/srv
      - caddy_data:/data
      - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:
```

Make sure to fill in `<version>` with the latest version number, which you can find listed on [Docker Hub](https://hub.docker.com/_/caddy) under the "Tags" section.

Then, create a file named `Caddyfile` beside the `docker-compose.yml`, and write your [Caddyfile](/docs/caddyfile/concepts) configuration.

If you have static files to serve, you may place them in a `site/` directory beside the configs, then set the [`root` directive](/docs/caddyfile/directives/root) to `/srv/`. If you don't, then you may remove the `/srv` volume mount.

Then, you can start the container:
<pre><code class="cmd bash">docker-compose up -d</code></pre>

To reload Caddy after making changes to your Caddyfile:
<pre><code class="cmd bash">docker-compose exec -w /etc/caddy caddy caddy reload</code></pre>

To see Caddy's logs:
<pre><code class="cmd bash">docker-compose logs caddy</code></pre>

