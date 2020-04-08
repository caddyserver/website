---
title: "API"
---

# API

Caddy is configured through an administration endpoint which can be accessed via HTTP using a [REST](https://en.wikipedia.org/wiki/Representational_state_transfer) API. You can [configure this endpoint](/docs/json/admin/) in your Caddy config.

**Default address: `localhost:2019`**

The latest configuration will be saved to disk after any changes (unless [disabled](/docs/json/admin/config/)). You can resume the last working config after a restart with [`caddy run --resume`](/docs/command-line#caddy-run), which guarantees config durability in the event of a power cycle or similar.

To get started with the API, try our [API tutorial](/docs/api-tutorial) or, if you only have a minute, our [API quick-start guide](/docs/quick-starts/api).

---

- **[POST /load](#post-load)**
  Sets or replaces the active configuration

- **[POST /stop](#post-stop)**
  Stops the active configuration and exits the process

- **[GET /config/[path]](#get-configpath)**
  Exports the config at the named path

- **[POST /config/[path]](#post-configpath)**
  Sets or replaces object; appends to array
  
- **[PUT /config/[path]](#put-configpath)**
  Creates new object; inserts into array

- **[PATCH /config/[path]](#patch-configpath)**
  Replaces an existing object or array element

- **[DELETE /config/[path]](#delete-configpath)**
  Deletes the value at the named path

- **[Using `@id` in JSON](#using-id-in-json)**
  Easily traverse into the config structure



## POST /load

Sets Caddy's configuration, overriding any previous configuration. It blocks until the reload completes or fails. Configuration changes are lightweight, efficient, and incur zero downtime. If the new config fails for any reason, the old config is rolled back into place without downtime.

This endpoint supports different config formats using config adapters. The request's Content-Type header indicates the config format used in the request body. Usually, this should be `application/json` which represents Caddy's native config format. For another config format, specify the appropriate Content-Type so that the value after the forward slash / is the name of the config adapter to use. For example, when submitting a Caddyfile, use a value like `text/caddyfile`; or for JSON 5, use a value such as `application/json5`; etc.

### Examples

Set a new active configuration:

<pre><code class="cmd bash">curl -X POST "http://localhost:2019/load" \
	-H "Content-Type: application/json" \
	-d @caddy.json</code></pre>

Note: curl's `-d` flag removes newlines, so if your config format is sensitive to line breaks (e.g. the Caddyfile), use `--data-binary` instead:

<pre><code class="cmd bash">curl -X POST "http://localhost:2019/load" \
	-H "Content-Type: text/caddyfile" \
	--data-binary @Caddyfile</code></pre>


## POST /stop

Gracefully shuts down the server and exits the process. To only stop the running configuration without exiting the process, use [DELETE /config/](#delete-configpath).

### Example

Stop the process:

<pre><code class="cmd bash">curl -X POST "http://localhost:2019/stop"</code></pre>


## GET /config/[path]

Exports Caddy's current configuration at the named path. Returns a JSON body.

### Examples

Export entire config and pretty-print it:

<pre><code class="cmd"><span class="bash">curl "http://localhost:2019/config/" | jq</span>
{
	"apps": {
		"http": {
			"servers": {
				"myserver": {
					"listen": [
						":443"
					],
					"routes": [
						{
							"match": [
								{
									"host": [
										"example.com"
									]
								}
							],
							"handle": [
								{
									"handler": "file_server"
								}
							]
						}
					]
				}
			}
		}
	}
}</code></pre>

Export just the listener addresses:

<pre><code class="cmd"><span class="bash">curl "http://localhost:2019/config/apps/http/servers/myserver/listen"</span>
[":443"]</code></pre>



## POST /config/[path]

Changes Caddy's configuration at the named path to the JSON body of the request. If the destination value is an array, POST appends; if an object, it creates or replaces.

As a special case, many items can be added to an array if:

1. the path ends in `/...`
2. the element of the path before `/...` refers to an array
3. the payload is an array

In this case, the elements in the payload's array will be expanded, and each one will be appended to the destination array. In Go terms, this would have the same effect as:

```go
baseSlice = append(baseSlice, newElems...)
```

### Examples

Add a listener address:

<pre><code class="cmd bash">curl -X POST \
	-H "Content-Type: application/json" \
	-d '":8080"' \
	"http://localhost:2019/config/apps/http/servers/myserver/listen"</code></pre>

Add multiple listener addresses:

<pre><code class="cmd bash">curl -X POST \
	-H "Content-Type: application/json" \
	-d '[":8080", ":5133"]' \
	"http://localhost:2019/config/apps/http/servers/myserver/listen/..."</code></pre>

## PUT /config/[path]

Changes Caddy's configuration at the named path to the JSON body of the request. If the destination value is a position (index) in an array, PUT inserts; if an object, it strictly creates a new value.

### Example

Add a listener address in the first slot:

<pre><code class="cmd bash">curl -X PUT \
	-H "Content-Type: application/json" \
	-d '":8080"' \
	"http://localhost:2019/config/apps/http/servers/myserver/listen/0"</code></pre>


## PATCH /config/[path]

Changes Caddy's configuration at the named path to the JSON body of the request. PATCH strictly replaces an existing value or array element.

### Example

Replace the listener addresses:

<pre><code class="cmd bash">curl -X PATCH \
	-H "Content-Type: application/json" \
	-d '[":8081", ":8082"]' \
	"http://localhost:2019/config/apps/http/servers/myserver/listen"</code></pre>



## DELETE /config/[path]

Removes Caddy's configuration at the named path. DELETE deletes the target value.

### Examples

To unload the entire current configuration but leave the process running:

<pre><code class="cmd bash">curl -X DELETE "http://localhost:2019/config/"</code></pre>

To stop only one of your HTTP servers:

<pre><code class="cmd bash">curl -X DELETE "http://localhost:2019/config/apps/http/servers/myserver"</code></pre>


## Using `@id` in JSON

You can embed IDs in your JSON document for easier direct access to those parts of the JSON.

Simply add a field called `"@id"` to an object and give it a unique name. For example, if you had a reverse proxy handler that you wanted to access frequently:

```json
{
	"@id": "my_proxy",
	"handler": "reverse_proxy"
}
```

To use it, simply make a request to the `/id/` API endpoint in the same way you would to the corresponding `/config/` endpoint, but without the whole path. The ID takes the request directly into that scope of the config for you.

For example, to access the upstreams of the reverse proxy without an ID, the path would be something like

```
/config/apps/http/servers/myserver/routes/1/handle/0/upstreams
```

but with an ID, the path becomes

```
/id/my_proxy/upstreams
```

which is much easier to remember and write by hand.
