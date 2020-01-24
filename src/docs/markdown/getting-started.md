---
title: "Getting Started"
---

# Getting Started

Welcome to Caddy! This tutorial will explore the basics of using Caddy and help you get familiar with it at a high level.

**Objectives:**
- 🔲 Run the daemon
- 🔲 Try the API
- 🔲 Give Caddy a config
- 🔲 Test config
- 🔲 Make a Caddyfile
- 🔲 Use the config adapter
- 🔲 Start with an initial config
- 🔲 Compare JSON and Caddyfile
- 🔲 Compare API and config files
- 🔲 Run in the background
- 🔲 Zero-downtime config reload

**Prerequisites:**
- Basic terminal / command line skills
- Basic text editor skills
- `caddy` and `curl` in your PATH

---

Let's start by running it:

<pre><code class="cmd bash">caddy</code></pre>

Oops; without a subcommand, the `caddy` command only displays help text. You can use this any time you forget what to do.

To start Caddy as a daemon, use the `run` subcommand:

<aside class="complete">✅ Run the daemon</aside>
<pre><code class="cmd bash">caddy run</code></pre>

This blocks forever, but what is it doing? At the moment... nothing. By default, Caddy's configuration ("config") is blank. We can verify this using the [admin API](/docs/api) in another terminal:

<aside class="complete">✅ Try the API</aside>
<pre><code class="cmd bash">curl localhost:2019/config/</code></pre>

We can make Caddy useful by giving it a config. This can be done many ways, but we'll start by making a POST request to the [/load](/docs/api#post-load) endpoint using `curl`.



## Your first config

To prepare our request, we need to make a config. At its core, Caddy's configuration is simply a [JSON document](/docs/json/).

<aside class="tip">
	Config files are not required. The admin API can always be used without files, which is handy when automating.
</aside>

Save this to a JSON file:

```json
{
	"apps": {
		"http": {
			"servers": {
				"example": {
					"listen": [":2015"],
					"routes": [
						{
							"handle": [{
								"handler": "static_response",
								"body": "Hello, world!"
							}]
						}
					]
				}
			}
		}
	}
}
```

Then upload it:

<pre><code class="cmd bash">curl localhost:2019/load \
  -X POST \
  -H "Content-Type: application/json" \
  -d @caddy.json
</code></pre>

<aside class="complete">✅ Give Caddy a config</aside>

We can verify that Caddy applied our new config with another GET request:

<pre><code class="cmd bash">curl localhost:2019/config/</code></pre>

Test that it works by going to [localhost:2015](http://localhost:2015) in your browser or use `curl`:

<pre><code class="cmd"><span class="bash">curl localhost:2015</span>
Hello, world!</code></pre>

<aside class="complete">✅ Test config</aside>

If you see _Hello, world!_, then congrats -- it's working! It's always a good idea to make sure your config works as you expect, especially before deploying into production.



## Your first Caddyfile

That was _kind of a lot of work_ just for Hello World.

Another way to configure Caddy is with the [**Caddyfile**](/docs/caddyfile). The same config we wrote in JSON above can be expressed simply as:

```
:2015

respond "Hello, world!"
```

<aside class="complete">✅ Make a Caddyfile</aside>

Save that to a file named `Caddyfile` (no extension) in the current directory.

Stop Caddy if it is already running (Ctrl+C), then run:

<pre><code class="cmd bash">caddy adapt</code></pre>

Or if you stored the Caddyfile somewhere else or named it something other than `Caddyfile`:

<pre><code class="cmd bash">caddy adapt --config /path/to/Caddyfile</code></pre>

<aside class="complete">✅ Use the config adapter</aside>

You will see JSON output! What happened here?

We just used a [_config adapter_](/docs/config-adapters) to convert our Caddyfile to Caddy's native JSON structure.

While we could take that output and make another API request, we can skip all those steps because the `caddy` command can do it for us.

Since the Caddyfile is so common, if there is a file called Caddyfile in the current directory and no other config is specified, Caddy will load the Caddyfile, adapt it for us, and run it right away.

So now that there is a Caddyfile in the current folder, let's do `caddy run` again:

<pre><code class="cmd bash">caddy run</code></pre>

Or if your Caddyfile is somewhere else (or named something else):

<pre><code class="cmd bash">caddy run \
	--config /path/to/Caddyfile \
	--adapter caddyfile</code></pre>

You can now try loading your site again and you will see that it is working!

<aside class="complete">✅ Start with an initial config</aside>

As you can see, we can start Caddy with an initial config several ways:

- A file named Caddyfile in the current directory
- The `--config` flag (optionally with the `--adapter` flag)
- The `--resume` flag (if a config was loaded previously)


## JSON vs. Caddyfile

Now you know that the Caddyfile is just converted to JSON under the hood.

The Caddyfile seems simpler than the JSON, but should you always use it? There are pros and cons to each approach. The answer depends on your requirements and use case.

JSON | Caddyfile
-----|----------
Ubiquitous | Niche
Easy to generate | Easy to craft by hand
Easily programmable | Difficult to automate
Full range of Caddy functionality | Most common parts of Caddy functionality
Extremely expressive | Moderately expressive
Allows config traversal | Cannot traverse within Caddyfile
Partial config changes | Whole config changes only
Can be exported | Cannot be exported
Compatible with all API endpoints | Compatible with some API endpoints
Documentation generated automatically | Documentation is hand-written
More efficient | More computational
Kind of boring | Kind of fun
**Learn more: [JSON structure](/docs/json/)** | **Learn more: [Caddyfile docs](/docs/caddyfile)**

You will need to decide which is best for your use case.

<aside class="complete">✅ Compare JSON and Caddyfile</aside>

It is important to note that both JSON and the Caddyfile (and [any other supported config adapter](/docs/config-adapters)) can be used with Caddy's API. However, you get the full range of Caddy's functionality and API features if you use JSON. If using a config adapter, the only way to load or change the config with the API is the [/load endpoint](/docs/api#post-load).


## API vs. Config files

<aside class="tip">
	Under the hood, even config files go through Caddy's API endpoints; but the `caddy` command wraps the API calls up for you.
</aside>

You will also want to decide whether your workflow is API-based or CLI-based. (You _can_ use both the API and config files on the same server, but we don't recommend it: best to have one source of truth.)

API | Config files
----|-------------
Make config changes with HTTP requests | Make config changes with shell commands
Easy to scale | Difficult to scale
Difficult to manage by hand | Easy to manage by hand
Really fun | Also fun
**Learn more: [API tutorial](/docs/api-tutorial)** | **Learn more: [Caddyfile tutorial](/docs/caddyfile-tutorial)**

<aside class="tip">
	Manually managing a server's configuration with the API is actually totally doable with proper tools, for example: a REST client GUI application.
</aside>

The choice of API or config file workflow is orthogonal to the use of config adapters: you can use JSON but store it in a file and use the command line interface; conversely, you can also use the Caddyfile (e.g. from a template) with the API.

But most people will use JSON+API or Caddyfile+CLI combinations.

As you can see, Caddy is well-suited for a wide variety of use cases and deployments!

<aside class="complete">✅ Compare API and config files</aside>



## Start, stop, run

Since Caddy is a server, it runs indefinitely. That means your terminal won't unblock (can't be used) after you execute `caddy run` until the process is terminated (usually Ctrl+C).

Although `caddy run` is the most common and is usually recommended (especially when making a system service!), you can alternatively use `caddy start` to start Caddy and have it run in the background:

<pre><code class="cmd bash">caddy start</code></pre>

This will let you use your terminal again, which is convenient in some interactive headless environments.

You will then have to stop the process yourself, since Ctrl+C won't stop it for you:

<pre><code class="cmd bash">caddy stop</code></pre>

Or use [the /stop endpoint](/docs/api#post-stop) of the API.

<aside class="complete">✅ Run in the background</aside>


## Reloading config

Whether using the API or command line, your server can perform zero-downtime config reloads or changes.

All [API endpoints](/docs/api) that load or change config are already graceful with zero downtime.

When using config files with the CLI, however, it may be tempting to use Ctrl+C to stop your server and restart it again to pick up the new configuration. This is sometimes fine in local dev environments, but is a bad idea on a production server.

Instead, use the [`caddy reload`](/docs/command-line#caddy-reload) command:

<aside class="tip">
	Technically, the new config is started before the old config is stopped, so for a brief time, both configs are running! If the new config fails, the old one is simply not stopped, rather than being "rolled back".
</aside>

<pre><code class="cmd bash">caddy reload</code></pre>

This actually just uses the API under the hood, but it will load and (if necessary) adapt your config file to JSON, then gracefully replace the active configuration without downtime.

If there are any errors loading the new config, Caddy rolls back to the last working config.

<aside class="complete">✅ Zero-downtime config reload</aside>