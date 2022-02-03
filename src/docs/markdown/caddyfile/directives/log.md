---
title: log (Caddyfile directive)
---

<script>
$(function() {
	// We'll add links to all the subdirectives if a matching anchor tag is found on the page.
	addLinksToSubdirectives();
});
</script>

# log

Enables and configures HTTP request logging (also known as access logs).

The `log` directive applies to the host/port of the site block it appears in, not any other part of the site address (e.g. path).

- [Syntax](#syntax)
- [Output modules](#output-modules)
  - [stderr](#stderr)
  - [stdout](#stdout)
  - [discard](#discard)
  - [file](#file)
  - [net](#net)
- [Format modules](#format-modules)
  - [console](#console)
  - [json](#json)
  - [single_field](#single-field)
  - [filter](#filter)
    - [delete](#delete)
	- [replace](#replace)
	- [ip_mask](#ip-mask)
- [Examples](#examples)


## Syntax

```caddy-d
log {
	output <writer_module> ...
	format <encoder_module> ...
	level  <level>
}
```

- **output** configures where to write the logs. See [Output modules](#output-modules) below. Default: `stderr`
- **format** describes how to encode, or format, the logs. See [Format modules](#format-modules) below. Default: `console` if `stdout` is detected to be a terminal, `json` otherwise.
- **level** is the minimum entry level to log. Default: `INFO`. Note that access logs currently only emit `INFO` and `ERROR` level logs.



### Output modules

The **output** subdirective lets you customize where logs get written. It appears within a `log` block.

#### stderr

Standard error (console, default).

```caddy-d
output stderr
```

#### stdout

Standard output (console).

```caddy-d
output stdout
```

#### discard

No output.

```caddy-d
output discard
```

#### file

A file. By default, log files are rotated ("rolled") to prevent disk space exhaustion.

```caddy-d
output file <filename> {
	roll_disabled
	roll_size     <size>
	roll_keep     <num>
	roll_keep_for <days>
}
```

- **&lt;filename&gt;** is the path to the log file.
- **roll_disabled** disables log rolling. This can lead to disk space depletion, so only use this if your log files are maintained some other way.
- **roll_size** is the size at which to roll the log file. The current implementation supports megabyte resolution; fractional values are rounded up to the next whole megabyte. For example, `1.1MiB` is rounded up to `2MiB`. Default: `100MiB`
- **roll_keep** is how many log files to keep before deleting the oldest ones. Default: `10`
- **roll_keep_for** is how long to keep rolled files as a [duration string](/docs/conventions#durations). The current implementation supports day resolution; fractional values are rounded up to the next whole day. For example, `36h` (1.5 days) is rounded up to `48h` (2 days). Default: `2160h` (90 days)


#### net

A network socket. If the socket goes down, it will dump logs to stderr while it attempts to reconnect.

```caddy-d
output net <address> {
	dial_timeout <duration>
}
```

- **&lt;address&gt;** is the [address](/docs/conventions#network-addresses) to write logs to.
- **dial_timeout** is how long to wait for a successful connection to the log socket. Log emissions may be blocked for up to this long if the socket goes down.



### Format modules

The **format** subdirective lets you customize how logs get encoded (formatted). It appears within a `log` block.

In addition to the syntax for each individual encoder, these common properties can be set on most encoders:

```caddy-d
format <encoder_module> {
	message_key <key>
	level_key   <key>
	time_key    <key>
	name_key    <key>
	caller_key  <key>
	stacktrace_key <key>
	line_ending  <char>
	time_format  <format>
	level_format <format>
}
```

- **message_key** The key for the message field of the log entry. Default: `msg`
- **level_key** The key for the level field of the log entry. Default: `level`
- **time_key** The key for the time field of the log entry. Default: `ts`
- **name_key** The key for the name field of the log entry (i.e. the name of the logger itself). Default: `name`
- **caller_key** The key for the caller field of the log entry.
- **stacktrace_key** The key for the stacktrace field of the log entry.
- **line_ending** The line endings to use.
- **time_format** The format for timestamps.
- **level_format** The format for levels.

#### console

The console encoder formats the log entry for human readability while preserving some structure.

```caddy-d
format console
```

#### json

Formats each log entry as a JSON object.

```caddy-d
format json
```

#### single_field

<span class="warning">⚠️ This format is deprecated, and will be removed in a future version.</span>

Writes only a single field from the structure log entry. Useful if one of the fields has all the information you need.

```caddy-d
format single_field <field_name>
```

- **&lt;field_name&gt;** is the name of the field whose value to use as the log entry.

#### filter

Wraps another encoder module, allowing per-field filtering.

```caddy-d
format filter {
	wrap <encode_module> ...
	fields {
		<field> <filter> ...
	}
}
```

Nested fields can be referenced by representing a layer of nesting with `>`. In other words, for an object like `{"a":{"b":0}}`, the inner field can be referenced as `a>b`.

The following fields are fundamental to the log and cannot be filtered because they are added by the underlying logging library as special cases: `ts`, `level`, `logger`, and `msg`.

These are the available filters:

##### delete

Marks a field to be skipped from being encoded.

```caddy-d
<field> delete
```

##### replace

Marks a field to be replaced with the provided string at encoding time.

```caddy-d
<field> replace <replacement>
```

##### ip_mask

Masks IP addresses in the field using a CIDR mask, i.e. the number of bytes from the IP to retain, starting from the left side. There is separate configuration for IPv4 and IPv6 addresses.


```caddy-d
<field> ip_mask {
	ipv4 <cidr>
	ipv6 <cidr>
}
```




## Examples

Enable access logging (to the console):

```caddy-d
log
```


Write logs to a file (with log rolling, which is enabled by default):

```caddy-d
log {
	output file /var/log/access.log
}
```


Customize log rolling:

```caddy-d
log {
	output file /var/log/access.log {
		roll_size 1gb
		roll_keep 5
		roll_keep_for 720h
	}
}
```


Use Common Log Format (CLF):

<span class="warning">⚠️ The `single_field` format is deprecated and will be removed in a future version. To encode logs in common log format, please use the [`format-encoder`](https://github.com/caddyserver/format-encoder) plugin.</span>

```caddy-d
log {
	format single_field common_log
}
```


Delete the Authorization request header from the logs:

```caddy-d
log {
	format filter {
		wrap console
		fields {
			request>headers>Authorization delete
		}
	}
}
```


Mask the remote address from the request, keeping the first 16 bits (i.e. 255.255.0.0) for IPv4 addresses, and the first 32 bits from IPv6 addresses, and also deletes the `common_log` field which would normally contain an unmasked IP address:

```caddy-d
log {
	format filter {
		wrap console
		fields {
			common_log delete
			request>remote_addr ip_mask {
				ipv4 16
				ipv6 32
			}
		}
	}
}
```
