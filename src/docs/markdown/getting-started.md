---
title: "Getting Started"
---

# Getting Started

This guide will help you get a site up and running with Caddy on **Linux** in a matter of minutes, but it is _not the only way_ to do it. There are many ways you can [download](/download), [install](/docs/install), [configure](/docs/introduction), and [run](/docs/running) Caddy. **If you are already comfortable with setting up services using systemd, jump to [Introduction](/docs/introduction).**

You can jump out of this tutorial at any time when you feel like you know what to do next.

**Objectives:**
- 🔲 Install Caddy as a service
- 🔲 Discover the unit configuration
- 🔲 Prepare your site
- 🔲 Serve your site over HTTPS
- 🔲 Add a reverse proxy
- 🔲 Learn how to troubleshoot problems

**Prerequisites:**
- A computer where you have administrator, root, or sudo privileges
- Know how to use a terminal / command line
- Familiarity with Unix permissions
- Be comfortable editing text files
- A registered domain name

---

First, ensure no other web servers are running on your machine (to avoid port-binding conflicts).

**[Install Caddy](/docs/install) by following the instructions for your system.** For example, if you're on Ubuntu, follow the steps that use `apt`; on Fedora, use `dnf`; etc. If a package isn't available for your distro, you can also [manually install Caddy as a service](/docs/running) on any Linux machine that has systemd.

<aside class="tip">

All you really need to run Caddy is the executable file itself. "Installing" Caddy could be defined simply as putting Caddy in your PATH. But installing Caddy _as a service_ is best practice for production systems because generally, a service keeps the process running after reboots, implements a tighter permissions/security model, and centralizes logging.

</aside>

Verify that the Caddy service is running:

<pre><code class="cmd bash">systemctl status caddy</code></pre>

You should see output like this:

```plain
● caddy.service - Caddy
     Loaded: loaded (/lib/systemd/system/caddy.service; enabled; vendor preset: enabled)
     Active: active (running) since Tue 2022-09-06 21:15:31 MDT; 1 day 1h ago
...
```

Ensure it says "enabled" and "active (running)" -- these are crucial for production. (Enabled means the service will be started automatically after a reboot.)

If Caddy failed to start, the most likely cause is you have another web server running. The output will also show the most recent log lines which you can inspect for error messages. After resolving the issue, run `sudo systemctl start caddy` to try again.

<aside class="complete">Install Caddy as a service</aside>

How is your web server's service configured? A unit file (ending with `.service`) contains the service configuration. The [default unit file we provide](https://github.com/caddyserver/dist/blob/master/init/caddy.service) runs Caddy with a configuration file. It tells you the precise `caddy` command, the location of the Caddy config, special permissions, the process' working directory, and any environment variables passed to the process.

Notice the output above shows the location of the `caddy.service` file. Let's print its contents:

<pre><code class="cmd bash">cat /lib/systemd/system/caddy.service</code></pre>

You will see the `ExecStart=` line, which defines the command to execute. The `ExecReload=` line the command that is executed to reload the configuration when you do `systemctl reload caddy`. The `--config` flag in the `caddy` commands is the location of the Caddy configuration file. Take note of this, as its location varies by platform (but it is often `/etc/caddy/Caddyfile`).

<aside class="complete">Discover the unit configuration</aside>

- **If you are running Caddy locally on your own computer:** you can go to [http://localhost](http://localhost) in your browser and you should see a slanted page telling you how to get rid of the slanted page. (It's our default "welcome" page to let you know the server is working. 🙃) You can follow those instructions if you want; they're similar to this tutorial but more succinct.

- **If you are setting up a remote server:** you can either run `curl localhost` on that machine, or you can navigate to the IP address of your server in your web browser or run `curl <ip>` locally.

## Your first site

Copy your site's static files (HTML, CSS, JS, images, etc.) into a folder that is accessible to the `caddy` user/group. This folder is called the _site root_. In production, it's often `/var/www/html` and we'll use that path in this tutorial. Expect that everything in this directory will become publicly accessible.

Once your site files are in place, make sure Caddy can access them; for example:

<pre><code class="cmd bash">chown -R caddy:caddy /var/www/html</code></pre>

Next, we need to tell Caddy where to find the site root. Open the configuration file you noted above (e.g. `/etc/caddy/Caddyfile`) and change its `root` directive to point to your site's directory:

```caddy
:80 {
	root * /var/www/html
	file_server
}
```

<aside class="tip">

The permissions on this Caddyfile are restricted to prevent tampering and accidental changes. To save changes to this Caddyfile, you may need to open it as root (`sudo`).

</aside>

Be sure to save the changes.

Since we changed the Caddyfile, we need to load the new config into Caddy:

<pre><code class="cmd bash">sudo systemctl reload caddy</code></pre>

- **If that failed:** double-check your Caddyfile. Spaces are significant; make sure it looks tidy. Check file and folder permissions. Ensure the path is correct.

- **If that succeeded:** open your browser to [http://localhost](http://localhost) again and you should see your site! If you don't, make sure the file permissions are correct and that you have an index file in your site root (e.g. `index.html`).

<aside class="tip">

Advanced sites often have additional configuration in production to [set headers](/docs/caddyfile/directives/header), enable [compression](/docs/caddyfile/directives/encode) or use compressed [sidecar files](/docs/caddyfile/directives/file_server), and [enable HTTP request logging](/docs/caddyfile/directives/log).

</aside>

<aside class="complete">Prepare your site</aside>


## HTTPS

Given a domain name, Caddy will obtain a TLS certificate for your site and keep it renewed while it stays running. It's all [automatic](/docs/automatic-https)!

Before continuing, **point your domain to your server's IP address.** This means setting the value of your domain's A/AAAA record(s) to the public IP address of your server.

Usually this means logging into your DNS provider and creating or changing the A (IPv4) and/or AAAA (IPv6) record for your domain (it can be a subdomain). We'll use `example.com` for this tutorial. Verify it has been set by running `dig example.com`.

Then, **verify that your server's IP is publicly routable on the standard Web ports (80 and 443).** Ensure there are no firewalls or routers blocking these ports. On a home network, you may need to forward those ports to your machine (just be aware that your machine will become publicly accessible on those ports).

Once your DNS and network infrastructure are properly configured, **all you need to do is replace `:80` in the Caddyfile with your domain name:**

```caddy
example.com {
	root * /var/www/html
	file_server
}
```

Then reload the config once again:

<pre><code class="cmd bash">sudo systemctl reload caddy</code></pre>

Watch the logs to make sure it works:

<pre><code class="cmd bash">journalctl -u caddy -f</code></pre>

- **If it succeeds:** navigate to your site in your browser and see your site served over HTTPS, just like that!
- **If it fails:** refer to the [troubleshooting tips](#troubleshooting) below.

As you have just seen, Caddy serves sites over HTTPS automatically and by default (unless you explicitly configure `http://` or the HTTP port). As long as you keep your network and DNS properly configured, Caddy will keep your certificates renewed automatically.

Caddy is the only server that works like this!

<aside class="complete">Serve your site over HTTPS</aside>

If you don't want to use a public domain name or are running this internally or locally instead, you can easily have Caddy use [fully-managed self-signed certificates](/docs/automatic-https#local-https) by specifying either:

- your local/internal IP address,
- the hostname `localhost`,
- or any hostname that ends in `.localhost`

instead of a registered public domain name.


## Reverse proxy

Oftentimes, your site consists of a backend application, but you want to put Caddy in front to handle TLS, routing, and other network-related details. Caddy's proxy is easy to use and extremely powerful.

For example, if we have a backend that provides the site's API endpoints, we can easily proxy those with just 1 additional line of configuration:

```caddy
example.com {
	root * /var/www/html
	file_server
	reverse_proxy /api/* 127.0.0.1:9000
}
```

Notice the `reverse_proxy` directive. The first argument, `/api/*`, is a [path matcher](/docs/caddyfile/matchers) which filters only requests within `/api/`. Then it proxies those to the backend app listening on :9000.

If your backend is a PHP app, simply replace the `reverse_proxy` directive with the `php_fastcgi` directive:

```caddy
example.com {
	root * /var/www/html
	file_server
	php_fastcgi /api/* 127.0.0.1:9000
}
```

Make sure the address is the same as your php-fpm listener.

Note that you don't have to enable a file server or set a site root if you _only_ want to proxy requests. You can enable a proxy by itself:


```caddy
example.com {
	reverse_proxy 127.0.0.1:9000
}
```

That config terminates TLS and proxies everything to port 9000.

<aside class="complete">Add a reverse proxy</aside>

## Troubleshooting

The most important task when trying to fix a problem is to first get the error message(s) and/or logs.

### Debug logs

Enable debug logging if you haven't already. Put this at the top of your Caddyfile:

```caddy
{
	debug
}
```

A block at the very top of the file without any name is called a [global options block](/docs/caddyfile/options). If you already have a global options block, simply add the `debug` option to it; you can't have two global option blocks.

Reload your Caddy configuration and you will observe DEBUG-level logs which can give helpful insights!


### Request logs

Caddy can also log all the HTTP requests it receives (sometimes known as "access logs"). Simply add the `log` directive within your site block. For example:

```caddy
example.com {
	root * /var/www/html
	file_server
	log
}
```

These logs are printed to the same place as Caddy's runtime or process logs (stderr), but have the name `http.log.access` so you can tell them apart. Access logs show you great detail about HTTP requests and responses.

### curl

If your site isn't working the way you expect, avoid using a web browser unless you know what you're doing. Browser behavior is often overly magical, misleading, inconsistent, and frustrating, as it hides or obfuscates the underlying technical details you need to debug your site.

Use `curl -v` instead. The `-v` option prints HTTP information including the header which is vital to knowing what is happening. For example:

<pre><code class="cmd bash">curl -v https://example.com/</code></pre>

<aside class="tip">

To perform the exact same HTTP request as your browser, open its dev tools, go to the Network tab, and right-click the request. There should be an option like "Copy as curl". Then paste that into your terminal.

</aside>

Obviously, change the URL to the one you are trying to debug. You will see curl establish a TLS connection (if HTTPS), make an HTTP request, then print the resulting status code, response headers, and body. It does not follow redirects, enable compression, cache anything, think it is smarter than you, or do anything unexpected. The `curl` command is your true friend and ally in the war against errors.

Combined with server logs, curl requests are quite a powerful way to gain insights to what is happening.


### Certificates

If Caddy is having trouble getting certificates, leave Caddy running while you double-check your network and DNS configurations. These cause the _vast majority_ of problems.

<aside class="tip">

Caddy has special programming for handling certificate automation errors. It will retry with other CAs, gradually back off, and use test CAs (if available) until success. It's usually OK to leave it running while you fix any problems.

</aside>

Check the error messages: Caddy prints the errors as returned by the CA, so they can be quite helpful. For example, a connection timeout indicates the CA couldn't connect to your server, suggesting a problem with your network configuration or DNS records pointing to the wrong network.

- Make sure your A/AAAA records are correct.
- Make sure ports 80 and 443 are publicly accessible
- Make sure Caddy&mdash;not another server&mdash;is on the receiving end of ports 80 and 443

### Simplify

Many times, configuration files contain more than is needed or relevant to troubleshoot a problem. Try removing everything in your config file except the absolute minimum needed to make the site function. For example, you could disable compression or remove headers added in the reverse proxy. Incrementally making changes to your config will tell you lots about what is causing the problem.

And if nothing undesireable happens or breaks when you remove some config, then you removed config that was unnecessary. Congrats!

If you're behind a CDN like Cloudflare, consider disabling it temporarily while you troubleshoot. If the problem goes away, you can know it is related to your CDN configuration.

<aside class="complete">Learn how to troubleshoot problems</aside>

