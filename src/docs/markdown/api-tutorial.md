---
title: "API Tutorial"
---

# API Tutorial

This tutorial will show you how to use Caddy's [admin API](/docs/api), which makes it possible to automate in a programmable fashion.

**Objectives:**
- 🔲 Run the daemon
- 🔲 Give Caddy a config
- 🔲 Test config
- 🔲 Replace active config
- 🔲 Traverse config
- 🔲 Use `@id` tags

**Prerequisites:**
- Basic terminal / command line skills
- Basic JSON experience
- `caddy` and `curl` in your PATH

---

To start the Caddy daemon, use the `run` subcommand:

<pre><code class="cmd bash">caddy run</code></pre>

<aside class="complete">Run the daemon</aside>

This blocks forever, but what is it doing? At the moment... nothing. By default, Caddy's configuration ("config") is blank. We can verify this using the [admin API](/docs/api) in another terminal:

<pre><code class="cmd bash">curl localhost:2019/config/</code></pre>

We can make Caddy useful by giving it a config. One way to do this is by making a POST request to the [/load](/docs/api#post-load) endpoint. Just like any HTTP request, there are many ways to do this, but in this tutorial we'll use `curl`.

## Your first config

To prepare our request, we need to make a config. Caddy's configuration is simply a [JSON document](/docs/json/) (or [anything that converts to JSON](/docs/config-adapters)).

<aside class="tip">
	Config files are not required. The configuration API can always be used without files, which is handy when automating things. This tutorial uses a file because it is more convenient for editing by hand.
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
	-H "Content-Type: application/json" \
	-d @caddy.json
</code></pre>

<aside class="tip">
	Make sure you don't forget the @ in front of your filename; this tells curl you are sending a file.
</aside>

<aside class="complete">Give Caddy a config</aside>

We can verify that Caddy applied our new config with another GET request:

<pre><code class="cmd bash">curl localhost:2019/config/</code></pre>

Test that it works by going to [localhost:2015](http://localhost:2015) in your browser or using `curl`:

<pre><code class="cmd"><span class="bash">curl localhost:2015</span>
Hello, world!</code></pre>

<aside class="complete">Test config</aside>

If you see _Hello, world!_, then congrats -- it's working! It's always a good idea to make sure your config works as you expect, especially before deploying into production.

Let's change our welcome message from "Hello world!" to something a little more motivational: "I can do hard things." Make this change in your config file, so that the handler object now looks like this:

```json
{
	"handler": "static_response",
	"body": "I can do hard things."
}
```

Save the config file, then update Caddy's active configuration by running the same POST request again:

<pre><code class="cmd bash">curl localhost:2019/load \
	-H "Content-Type: application/json" \
	-d @caddy.json
</code></pre>

<aside class="complete">Replace active config</aside>

For good measure, verify that the config was updated:

<pre><code class="cmd bash">curl localhost:2019/config/</code></pre>

Test it by refreshing the page in your browser (or running `curl` again), and you will see an inspirational message!


## Config traversal

Instead of uploading the entire config file for a small change, let's use a powerful feature of Caddy's API to make the change without ever touching our config file.

<aside class="tip">
	Making little changes to production servers by replacing the entire config like we did above can be dangerous; it's like having root access to a file system. Caddy's API lets you limit the scope of your changes to guarantee that other parts of your config don't get changed accidentally.
</aside>

Using the request URI's path, we can traverse into the config structure and update only the message string (be sure to scroll right if clipped):

<pre><code class="cmd bash">curl \
	localhost:2019/config/apps/http/servers/example/routes/0/handle/0/body \
	-H "Content-Type: application/json" \
	-d '"Work smarter, not harder."'
</code></pre>


<aside class="tip">

Every time you change the config using the API, Caddy persists a copy of the new config so you can [**--resume** it later](/docs/command-line#caddy-run)!

</aside>


You can verify that it worked with a similar GET request, for example:

<pre><code class="cmd bash">curl localhost:2019/config/apps/http/servers/example/routes</code></pre>

You should see:

```json
[{"handle":[{"body":"Work smarter, not harder.","handler":"static_response"}]}]
```


<aside class="tip">

You can use the [`jq` command <img src="/old/resources/images/external-link.svg" class="external-link">](https://stedolan.github.io/jq/) to prettify JSON output: **`curl ... | jq`**

</aside>


<aside class="complete">Traverse config</aside>

**Important note:** This should be obvious, but once you use the API to make a change that is not in your original config file, your config file becomes obsolete. There are a few ways to handle this:

- Use the `--resume` of the [caddy run](/docs/command-line#caddy-run) command to use the last active config.
- Don't mix the use of config files with changes via the API; have one source of truth.
- [Export Caddy's new configuration](/docs/api#get-configpath) with a subsequent GET request (less recommended than the first two options).



## Using `@id` in JSON

Config traversal is certainly useful, but the paths are little long, don't you think?

We can give our handler object an [`@id` tag](/docs/api#using-id-in-json) to make it easier to access:

<pre><code class="cmd bash">curl \
	localhost:2019/config/apps/http/servers/example/routes/0/handle/0/@id \
	-H "Content-Type: application/json" \
	-d '"msg"'
</code></pre>

This adds a property to our handler object: `"@id": "msg"`, so it now looks like this:

```json
{
	"@id": "msg",
	"body": "Work smarter, not harder.",
	"handler": "static_response"
}
```


<aside class="tip">

**@id** tags can go in any object and can have any primitive value (usually a string). [Learn more](/docs/api#using-id-in-json)

</aside>


We can then access it directly:

<pre><code class="cmd bash">curl localhost:2019/id/msg</code></pre>

And now we can change the message with a shorter path:

<pre><code class="cmd bash">curl \
	localhost:2019/id/msg/body \
	-H "Content-Type: application/json" \
	-d '"Some shortcuts are good."'
</code></pre>

And check it again:

<pre><code class="cmd bash">curl localhost:2019/id/msg/body</code></pre>

<aside class="complete">Use <code>@id</code> tags</aside>

