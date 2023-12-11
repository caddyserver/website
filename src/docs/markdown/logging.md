---
title: How Logging Works
---

How Logging Works
=================

Caddy has powerful and flexible logging facilities, but they may be different than what you're used to, especially if you're coming from more archaic shared hosting or other legacy web servers.


## Overview

There are two main aspects of logging: emission and consumption.

**Emission** means to produce messages. It consists of three steps:

1. Gathering relevant information (context)
2. Building a useful representation (encoding)
3. Sending that representation to an output (writing)

This functionality is baked into the core of Caddy, enabling any part of the Caddy code base or that of modules (plugins) to emit logs.

**Consumption** is the intake &amp; processing of messages. In order to be useful, emitted logs must be consumed. Logs that are merely written but never read provide no value. Consuming logs can be as simple as an administrator reading console output, or as advanced as attaching a log aggregation tool or cloud service to filter, count, and index log messages.

### Caddy's role

_Caddy is a log emitter_. It does not consume logs, except for the minimum processing required to encode and write logs. This is important because it keeps Caddy's core simpler, leading to fewer bugs and edge cases, while reducing maintenance burden. Ultimately, log processing is out of the scope of Caddy core.

However, there's always the possibility for a Caddy app module that consumes logs. (It just doesn't exist yet, to our knowledge.)


## Structured logs

As with most modern applications, Caddy's logs are _structured_. This means that the information in a message is not simply an opaque string or byte slice. Instead, data remains strongly typed and is keyed by individual _field names_ until it is time to encode the message and write it out.

Compare traditional unstructured logs&mdash;like the archaic Common Log Format (CLF)&mdash;commonly used with traditional HTTP servers:

```
127.0.0.1 - - [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.1" 200 2326
```

This format "has structure" but is not "structured": it can only be used to log HTTP requests. There is no (efficient) way to encode it differently, because it is an opaque string of bytes. It is also missing a lot of information. It does not even include the Host header of the request! This log format is only useful when hosting a single site, and for getting the most basic of information about requests.

<aside class="tip">
	The lack of host information in CLF is why these logs usually need to be written to separate files when hosting more than one site: there is no way to know the Host header from the request otherwise!
</aside>

Now compare an equivalent structured log message from Caddy, encoded as JSON and formatted nicely for display:

```json
{
	"level": "info",
	"ts": 1646861401.5241024,
	"logger": "http.log.access",
	"msg": "handled request",
	"request": {
		"remote_ip": "127.0.0.1",
		"remote_port": "41342",
		"client_ip": "127.0.0.1",
		"proto": "HTTP/2.0",
		"method": "GET",
		"host": "localhost",
		"uri": "/",
		"headers": {
			"User-Agent": ["curl/7.82.0"],
			"Accept": ["*/*"],
			"Accept-Encoding": ["gzip, deflate, br"],
		},
		"tls": {
			"resumed": false,
			"version": 772,
			"cipher_suite": 4865,
			"proto": "h2",
			"server_name": "example.com"
		}
	},
	"bytes_read": 0,
	"user_id": "",
	"duration": 0.000929675,
	"size": 10900,
	"status": 200,
	"resp_headers": {
		"Server": ["Caddy"],
		"Content-Encoding": ["gzip"],
		"Content-Type": ["text/html; charset=utf-8"],
		"Vary": ["Accept-Encoding"]
	}
}
```

You can see how the structured log is much more useful and contains much more information. The abundance of information in this log message is not only useful, but it comes at virtually no performance overhead: Caddy's logs are zero-allocation. Structured logs have no restrictions on data types or context: they can be used in any code path and include any kind of information.

Because the logs are structured and strongly-typed, they can be encoded into any format. So if you don't want to work with JSON, logs can be encoded into any other representation. Caddy supports others through [log encoder modules](/docs/json/logging/logs/encoder/), and even more can be added.

**Most importantly** in the distinction between structured logs and legacy formats, with a performance penalty a structured log [can be transformed into the legacy Common Log Format <img src="/old/resources/images/external-link.svg" class="external-link">](https://github.com/caddyserver/transform-encoder), but not the other way around. It is non-trivial (or at least inefficient) to go from CLF to structured formats, and impossible considering the lack of information.

In essence, efficient, structured logging generally promotes these philosophies:

- Too many logs are better than too few
- Filtering is better than discarding
- Defer encoding for greater flexibility and interoperability
 

## Emission

In code, a log emission resembles the following:

```go
logger.Debug("proxy roundtrip",
	zap.String("upstream", di.Upstream.String()),
	zap.Object("request", caddyhttp.LoggableHTTPRequest{Request: req}),
	zap.Object("headers", caddyhttp.LoggableHTTPHeader(res.Header)),
	zap.Duration("duration", duration),
	zap.Int("status", res.StatusCode),
)
```

<aside class="tip">
	This is an actual line of code from Caddy's reverse proxy. This line is what allows you to inspect requests to configured upstreams when you have debug logging enabled. It is an invaluable piece of data when troubleshooting!
</aside>

You can see that this one function call contains the log level, a message, and several fields of data. All these are strongly-typed, and Caddy uses a zero-allocation logging library so log emissions are quick and efficient with almost no overhead.

The `logger` variable is a `zap.Logger` that may have any amount of context associated with it, which includes both a name and fields of data. This allows loggers to "inherit" from parent contexts quite nicely, enabling advanced tracing and metrics.

From there, the message is sent through a highly efficient processing pipeline where it is encoded and written.


## Logging pipeline

As you saw above, messages are emitted by **loggers**. The messages are then sent to **logs** for processing.

Caddy lets you [configure multiple logs](/docs/json/logging/logs/) which can process messages. A log consists of an encoder, writer, minimum level, sampling ratio, and a list of loggers to include or exclude. In Caddy, there is always a default log named `default`. You can customize it by specifying a log keyed as `"default"` in [this object](/docs/json/logging/logs/) in the config.

<aside class="tip">

Now would be a good time to [explore Caddy's logging docs](/docs/json/logging/) so you can become familiar with the structure and parameters we're talking about.

</aside>


- **Encoder:** The format for the log. Transforms the in-memory data representation into a byte slice. Encoders have access to all fields of a log message.
- **Writer:** The log output. Can be any log writer module, like to a file or network socket. It simply writes bytes.
- **Level:** Logs have various levels, from DEBUG to FATAL. Messages lower than the specified level will be ignored by the log.
- **Sampling:** Extremely hot paths may emit more logs than can be processed effectively; enabling sampling is a way to reduce the load while still yielding a representative sample of messages.
- **Include/exclude:** Each message is emitted by a logger, which has a name (usually derived from the module ID). Logs can include or exclude messages from certain loggers.

When a log message is emitted from Caddy:

- The originating logger's name is checked against each log's include/exclude list; if included (or not excluded), it is admitted into that log.
- If sampling is enabled, a quick calculation determines whether to keep the log message.
- The message is encoded using the log's configured encoder.
- The encoded bytes are then written to the log's configured writer.

By default, all messages go to all configured logs. This adheres to the values of structured logging described above. You can limit which messages go to which logs by setting their include/exclude lists, but this is mostly for filtering messages from different modules; it is not intended to be used like a log aggregation service. To keep Caddy's logging pipeline streamlined and efficient, advanced processing of log messages is deferred to consumption.

## Consumption

After messages are sent to an output, a consumer will read them in, parse them, and handle them accordingly.

This is a very different problem domain from emitting logs, and the core of Caddy does not handle consumption (although a Caddy app module certainly could). There are numerous tools you can use for processing streams of JSON messages (or other formats) and viewing, filtering, indexing, and querying logs. You could even write or implement your own.

For example, if you run legacy software that requires CLF separated into different files based on a particular field (e.g. hostname), you could use or write a simple tool that reads in the JSON, calls `sprintf()` to create a CLF string, then write it to a file based on the value in the `request.host` field.

Caddy's logging facilities can be used to implement metrics and tracing as well: metrics basically count messages with certain characteristics, and tracing links multiple messages together based on commonalities between them.

There are countless possibilities for what you can do by consuming Caddy's logs!
