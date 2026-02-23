---
title: log (Caddyfile directive)
---

<script>
ready(function() {
	// Fix > in code blocks
	$$_('pre.chroma .k').forEach(item => {
		if (item.innerText.includes('>')) {
			// Skip if ends with >
			if (item.textContent.trim().endsWith('>')) return;
			// Replace > with <span class="p">&gt;</span>
			item.innerHTML = item.innerHTML.replace(/&gt;/g, '<span class="p">&gt;</span>');
		}
	});

	// We'll add links to all the subdirectives if a matching anchor tag is found on the page.
	addLinksToSubdirectives();
});
</script>

# log

Enables and configures HTTP request logging (also known as access logs).

<aside class="tip">

To configure Caddy's runtime logs, see the [`log` global option](/docs/caddyfile/options#log) instead.

</aside>


The `log` directive applies to the hostnames of the site block it appears in, unless overridden with the `hostnames` subdirective.

When configured, by default all requests to the site will be logged. To conditionally skip some requests from logging, use the [`log_skip` directive](log_skip).

To add custom fields to the log entries, use the [`log_append` directive](log_append).


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
  - [filter](#filter)
    - [delete](#delete)
	- [rename](#rename)
	- [replace](#replace)
	- [ip_mask](#ip-mask)
	- [query](#query)
	- [cookie](#cookie)
	- [regexp](#regexp)
	- [hash](#hash)
  - [append](#append)
- [Examples](#examples)

By default, headers with potentially sensitive information (`Cookie`, `Set-Cookie`, `Authorization` and `Proxy-Authorization`) will be logged as `REDACTED` in access logs. This behaviour can be disabled with the [`log_credentials`](/docs/caddyfile/options#log-credentials) global server option.


## Syntax

```caddy-d
log [<logger_name>] {
	hostnames <hostnames...>
	no_hostname
	output <writer_module> ...
	format <encoder_module> ...
	level  <level>
	sampling {
		interval   <duration>
		first      <number>
		thereafter <number>
	}
}
```

- **logger_name** <span id="logger_name"/> is an optional override of the logger name for this site.

  By default, a logger name is generated automatically, e.g. `log0`, `log1`, and so on depending on the order of the sites in the Caddyfile. This is only useful if you wish to reliably refer to the output of this logger from another logger defined in global options. See [an example](#multiple-outputs) below.

- **hostnames** <span id="hostnames"/> is an optional override of the hostnames that this logger applies to.

  By default, the logger applies to the hostnames of the site block it appears in, i.e. the site addresses. This is useful if you wish to define different loggers per subdomain in a [wildcard site block](/docs/caddyfile/patterns#wildcard-certificates). See [an example](#wildcard-logs) below.

- **no_hostname** <span id="no_hostname"/> prevents the logger from being associated with any of the site block's hostnames. By default, the logger is associated with the [site address](/docs/caddyfile/concepts#addresses) that the `log` directive appears in.

  This is useful when you want to log requests to different files based on some condition, such as the request path or method, using the [`log_name` directive](/docs/caddyfile/directives/log_name).

- **output** <span id="output"/> configures where to write the logs. See [`output` modules](#output-modules) below.

  Default: `stderr`.

- **format** <span id="format"/> describes how to encode, or format, the logs. See [`format` modules](#format-modules) below.

  Default: `console` if `stderr` is detected to be a terminal, `json` otherwise.

- **level** <span id="level"/> is the minimum entry level to log. Default: `INFO`.

  Note that access logs currently only emit `INFO` and `ERROR` level logs.

- **sampling** <span id="sampling"/> configures log sampling to reduce log volume. If sampling is specified, then it is enabled, with the defaults below taking effect. Omitting this disables sampling.

  - **interval** is the [duration window](/docs/conventions#durations) over which to conduct sampling. Default: `1s` (disabled).

  - **first** is how many logs to keep within a given level and message for a each interval. Default: `100`.

  - **thereafter** is how many logs to skip in each interval after the first kept logs. Default: `100`.

  For example, with `interval 1s`, `first 5`, and `thereafter 10`, in each 10-second interval the first 5 log entries will be kept, then it will allow through every 10th log entry with the same level and message within that second.


### Output modules

The **output** subdirective lets you customize where logs get written.

#### stderr

Standard error (console, is the default).

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

A file. By default, log files are rotated ("rolled") based on size to prevent disk space exhaustion.

Log rolling is provided by [timberjack <img src="/old/resources/images/external-link.svg" class="external-link">](https://github.com/DeRuina/timberjack)

<aside class="tip">

**A note about reloading log file options:** A server restart is required to apply configuration changes to a given output file.
The changes will not be applied at server reload time, unless you add a new log filename.

</aside>

```caddy-d
output file <filename> {
	mode          <mode>
	roll_disabled
	roll_size     <size>
	roll_interval <duration>
	roll_minutes  <minutes...>
	roll_at	      <times...>
	roll_uncompressed
	roll_local_time
	roll_keep     <num>
	roll_keep_for <days>
	backup_time_format <format>
}
```

- **&lt;filename&gt;** is the path to the log file.

  When rolled, files are renamed using the template `<name>-<timestamp>-<reason>.log`. The timestamp is formatted according to the [`backup_time_format`](#backup_time_format) option. The reason is either `size` or `time`, depending on which triggered the rotation. If the file gets compressed, `.gz` is appended to the filename.

   For example, if the filename is `access.log`, a rolled file might be named `access-2026-01-30T22-15-42.123-size.log` if it was rolled due to size, or `access-2025-01-30T00-00-00.000-time.log` if it was rolled due to time.

- **mode** <span id="mode"/> is the Unix file mode/permissions to use for the log file. The mode consists of between 1 and 4 octal digits (same as the numeric format accepted by the Unix [chmod <img src="/old/resources/images/external-link.svg" class="external-link">](https://en.wikipedia.org/wiki/Chmod) command, except that an all-zero mode is interpreted as the default mode `600`).

  For example: `0600` would set the mode to `rw-,---,---` (read/write access to the log file's owner, and no access to anyone else); `0640` would set the mode to `rw-,r--,---` (read/write access to file's owner, only read access to the group); `644` sets the mode to `rw-,r--,r--` provides read/write access to the log file's owner, but only read access to the group owner and other users.

- **roll_disabled** <span id="roll_disabled"/> disables log rolling. This can lead to disk space depletion, so only use this if your log files are maintained some other way.

- **roll_size** <span id="roll_size"/> is the size at which to roll the log file. The current implementation supports megabyte resolution; fractional values are rounded up to the next whole megabyte. For example, `1.1MiB` is rounded up to `2MiB`.

  This is always enabled. If a write to the logs causes the file to exceed the specified size, the log will be immediately rotated. The backup filename will include `size` as the reason.

  Default: `100MiB`

- **roll_interval** <span id="roll_interval"/> is the maximum duration between log rotations. The value is a [duration string](/docs/conventions#durations) after which to roll the log file.

  When enabled, the file is rotated on the next write to the logs after this duration has passed since the last rotation. The backup filename will include `time` as the reason.

  Note that if set to `24h`, it does not necessarily roll at midnight, but rather at the 24-hour mark since the last rotation. If rolling happens due to size, then the time of the next rotation would be offset compared to the previous rotation. You may use the `roll_at` or `roll_minutes` options to roll at specific times instead.

  Default: disabled

- **roll_minutes** <span id="roll_minutes"/> is a list of minute values (0-59) at which to roll the log file. For example, `10 40` would roll the log file every 30 minutes at `xx:10` and `xx:40` each hour. Rotations are aligned to the clock minute (second 0).

  Enabling this spawns a goroutine timer that triggers a log rotation at the specified minute values (i.e. introduces a small amount of background processing). This operates in addition to `roll_interval` and `roll_size`. The backup filename will include `time` as the reason.

  Default: disabled

- **roll_at** <span id="roll_at"/> is a list of time values (in 24-hour format) at which to roll the log file. For example, `00:00 12:00` would roll the log file twice daily at midnight and noon. Rotations are aligned to the clock minute (second 0).

  Enabling this spawns a goroutine timer that triggers a log rotation at the specified times (i.e. introduces a small amount of background processing). This operates in addition to `roll_interval` and `roll_size`. The backup filename will include `time` as the reason.

  Default: disabled

- **roll_uncompressed** <span id="roll_uncompressed"/> turns off gzip log compression.

  Default: `gzip` compression is enabled.

- **roll_local_time** <span id="roll_local_time"/> sets the rolling to use local timestamps in filenames. 
  Default: uses UTC time.

- **roll_keep** <span id="roll_keep"/> is how many log files to keep before deleting the oldest ones. Triggers when a new log file is created.

  Default: `10`

- **roll_keep_for** <span id="roll_keep_for"/> is how long to keep rolled files as a [duration string](/docs/conventions#durations). Triggers when a new log file is created.
  The current implementation supports day resolution; fractional values are rounded up to the next whole day. For example, `36h` (1.5 days) is rounded up to `48h` (2 days).
  
  Default: `2160h` (90 days)

- **backup_time_format** <span id="backup_time_format"/> is the time format to use in backup filenames. Must be a valid time layout string; see the [Go documentation](https://pkg.go.dev/time#pkg-constants) for full details.

  Default: `2006-01-02T15-04-05`


#### net

A network socket. If the socket goes down, it will dump logs to stderr while it attempts to reconnect.

```caddy-d
output net <address> {
	dial_timeout <duration>
	soft_start
}
```

- **&lt;address&gt;** is the [address](/docs/conventions#network-addresses) to write logs to.

- **dial_timeout** <span id="dial_timeout"/> is how long to wait for a successful connection to the log socket. Log emissions may be blocked for up to this long if the socket goes down.

- **soft_start** <span id="soft_start"/> will ignore errors when connecting to the socket, allowing you to load your config even if the remote log service is down. Logs will be emitted to stderr instead.


### Format modules

The **format** subdirective lets you customize how logs get encoded (formatted). It appears within a `log` block.

<aside class="tip">

**A note about Common Log Format (CLF):** CLF clashes with modern structured logs. To transform your access logs into the deprecated Common Log Format, please use the [`transform-encoder` plugin <img src="/old/resources/images/external-link.svg" class="external-link">](https://github.com/caddyserver/transform-encoder).

</aside>


In addition to the syntax for each individual encoder, these common properties can be set on most encoders:

```caddy-d
format <encoder_module> {
	message_key     <key>
	level_key       <key>
	time_key        <key>
	name_key        <key>
	caller_key      <key>
	stacktrace_key  <key>
	line_ending     <char>
	time_format     <format>
	time_local
	duration_format <format>
	level_format    <format>
}
```

- **message_key** <span id="message_key"/> The key for the message field of the log entry. Default: `msg`

- **level_key** <span id="level_key"/> The key for the level field of the log entry. Default: `level`

- **time_key** <span id="time_key"/> The key for the time field of the log entry. Default: `ts`
- **name_key** <span id="name_key"/> The key for the name field of the log entry. Default: `name`

- **caller_key** <span id="caller_key"/> The key for the caller field of the log entry.

- **stacktrace_key** <span id="stacktrace_key"/> The key for the stacktrace field of the log entry.

- **line_ending** <span id="line_ending"/> The line endings to use.

- **time_format** <span id="time_format"/> The format for timestamps.
  Default: `wall_milli` if the format defaulted to `console`, `unix_seconds_float` otherwise.
  
  May be one of:
  - `unix_seconds_float` Floating-point number of seconds since the Unix epoch.
  - `unix_milli_float` Floating-point number of milliseconds since the Unix epoch.
  - `unix_nano` Integer number of nanoseconds since the Unix epoch.
  - `iso8601` Example: `2006-01-02T15:04:05.000Z0700`
  - `rfc3339` Example: `2006-01-02T15:04:05Z07:00`
  - `rfc3339_nano` Example: `2006-01-02T15:04:05.999999999Z07:00`
  - `wall` Example: `2006/01/02 15:04:05`
  - `wall_milli` Example: `2006/01/02 15:04:05.000`
  - `wall_nano` Example: `2006/01/02 15:04:05.000000000`
  - `common_log` Example: `02/Jan/2006:15:04:05 -0700`
  - Or, any compatible time layout string; see the [Go documentation](https://pkg.go.dev/time#pkg-constants) for full details.
  
  Note that the parts of the format string are special constants for the layout; so `2006` is the year, `01` is the month, `Jan` is the month as a string, `02` is the day. Do not use the actual current date numbers in the format string.

- **time_local** <span id="time_local"/> Logs with the local system time rather than the default of UTC time.

- **duration_format** <span id="duration_format"/> The format for durations.

  Default: `seconds`.
  
  May be one of:
  - `s`, `second` or `seconds` Floating-point number of seconds elapsed.
  - `ms`, `milli` or `millis` Floating-point number of milliseconds elapsed.
  - `ns`, `nano` or `nanos` Integer number of nanoseconds elapsed.
  - `string` Using Go's built-in string format, for example `1m32.05s` or `6.31ms`.

- **level_format** <span id="level_format"/> The format for levels.

  Default: `color` if the format defaulted to `console`, `lower` otherwise.
  
  May be one of:
  - `lower` Lowercase.
  - `upper` Uppercase.
  - `color` Uppercase, with ANSI colors.
  

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


#### filter

Allows per-field filtering.

```caddy-d
format filter {
	fields {
		<field> <filter> ...
	}
	<field> <filter> ...
	wrap <encode_module> ...
}
```

Nested fields can be referenced by representing a layer of nesting with `>`. In other words, for an object like `{"a":{"b":0}}`, the inner field can be referenced as `a>b`.

The following fields are fundamental to the log and cannot be filtered because they are added by the underlying logging library as special cases: `ts`, `level`, `logger`, and `msg`.

Specifying `wrap` is optional; if omitted, a default is chosen depending on whether the current output module is [`stderr`](#stderr) or [`stdout`](#stdout), and is an interactive terminal, in which case [`console`](#console) is chosen, otherwise [`json`](#json) is chosen.

As a shortcut, the `fields` block can be omitted and the filters can be specified directly within the `filter` block.


These are the available filters:

##### delete

Marks a field to be skipped from being encoded.

```caddy-d
<field> delete
```


##### rename

Rename the key of a log field.

```caddy-d
<field> rename <key>
```


##### replace

Marks a field to be replaced with the provided string at encoding time.

```caddy-d
<field> replace <replacement>
```


##### ip_mask

Masks IP addresses in the field using a CIDR mask, i.e. the number of bits from the IP to retain, starting from the left side. If the field is an array of strings (e.g. HTTP headers), each value in the array is masked. The value may be a comma separated string of IP addresses.

There is separate configuration for IPv4 and IPv6 addresses, since they have a different total number of bits.

Most commonly, the fields to filter would be:
- `request>remote_ip` for the directly connecting client
- `request>client_ip` for the parsed "real client" when [`trusted_proxies`](/docs/caddyfile/options#trusted-proxies) is configured
- `request>headers>X-Forwarded-For` if behind a reverse proxy

```caddy-d
<field> ip_mask [<ipv4> [<ipv6>]] {
	ipv4 <cidr>
	ipv6 <cidr>
}
```


##### query

Marks a field to have one or more actions performed, to manipulate the query part of a URL field. Most commonly, the field to filter would be `request>uri`.

```caddy-d
<field> query {
	delete  <key>
	replace <key> <replacement>
	hash    <key>
}
```

The available actions are:

- **delete** removes the given key from the query.

- **replace** replaces the value of the given query key with **replacement**. Useful to insert a redaction placeholder; you'll see that the query key was in the URL, but the value is hidden.

- **hash** replaces the value of the given query key with the first 4 bytes of the SHA-256 hash of the value, lowercase hexadecimal. Useful to obscure the value if it's sensitive, while being able to notice whether each request had a different value.


##### cookie

Marks a field to have one or more actions performed, to manipulate a `Cookie` HTTP header's value. Most commonly, the field to filter would be `request>headers>Cookie`.

```caddy-d
<field> cookie {
	delete  <name>
	replace <name> <replacement>
	hash    <name>
}
```

The available actions are:

- **delete** removes the given cookie by name from the header.

- **replace** replaces the value of the given cookie with **replacement**. Useful to insert a redaction placeholder; you'll see that the cookie was in the header, but the value is hidden.

- **hash** replaces the value of the given cookie with the first 4 bytes of the SHA-256 hash of the value, lowercase hexadecimal. Useful to obscure the value if it's sensitive, while being able to notice whether each request had a different value.

If many actions are defined for the same cookie name, only the first action will be applied.


##### regexp

Marks a field to have a regular expression replacement applied at encoding time. If the field is an array of strings (e.g. HTTP headers), each value in the array has replacements applied.

```caddy-d
<field> regexp <pattern> <replacement>
```

The regular expression language used is RE2, included in Go. See the [RE2 syntax reference](https://github.com/google/re2/wiki/Syntax) and the [Go regexp syntax overview](https://pkg.go.dev/regexp/syntax).

In the replacement string, capture groups can be referenced with `${group}` where `group` is either the name or number of the capture group in the expression. Capture group `0` is the full regexp match, `1` is the first capture group, `2` is the second capture group, and so on.


##### hash

Marks a field to be replaced with the first 4 bytes (8 hex characters) of the SHA-256 hash of the value at encoding time. If the field is a string array (e.g. HTTP headers), each value in the array is hashed.

Useful to obscure the value if it's sensitive, while being able to notice whether each request had a different value.

```caddy-d
<field> hash
```

#### append

Appends field(s) to all log entries.

```caddy-d
format append {
	fields {
		<field> <value>
	}
	<field> <value>
	wrap <encode_module> ...
}
```

It is most useful for adding information about the Caddy instance that is producing the log entries, possibly via an environment variable. The field values may be global placeholders (e.g. `{env.*}`), but _not_ per-request placeholders due to logs being written outside of the HTTP request context.

Specifying `wrap` is optional; if omitted, a default is chosen depending on whether the current output module is [`stderr`](#stderr) or [`stdout`](#stdout), and is an interactive terminal, in which case [`console`](#console) is chosen, otherwise [`json`](#json) is chosen.

The `fields` block can be omitted and the fields can be specified directly within the `append` block.



## Examples

Enable access logging to the default logger.

In other words, by default this logs to `stderr`, but this can be changed by reconfiguring the `default` logger with the [`log` global option](/docs/caddyfile/options#log):

```caddy
example.com {
	log
}
```


Write logs to a file (with log rolling, which is enabled by default):

```caddy
example.com {
	log {
		output file /var/log/access.log
	}
}
```


Customize log rolling, rolling daily at midnight or when the log file reaches 1 GB (whichever comes first), and keeping 5 rolled files or 30 days of logs:

```caddy
example.com {
	log {
		output file /var/log/access.log {
			roll_at 00:00
			roll_size 1gb
			roll_keep 5
			roll_keep_for 720h
		}
	}
}
```


Delete the `User-Agent` request header from the logs:

```caddy
example.com {
	log {
		format filter {
			request>headers>User-Agent delete
		}
	}
}
```


Redact multiple sensitive cookies. (Note that some sensitive headers are logged with empty values by default; see the [`log_credentials` global option](/docs/caddyfile/options#log-credentials) to enable logging `Cookie` header values):

```caddy
example.com {
	log {
		format filter {
			request>headers>Cookie cookie {
				replace session REDACTED
				delete secret
			}
		}
	}
}
```


Mask the remote address from the request, keeping the first 16 bits (i.e. 255.255.0.0) for IPv4 addresses, and the first 32 bits from IPv6 addresses.

Note that as of Caddy v2.7, both `remote_ip` and `client_ip` are logged, where `client_ip` is the "real IP" when [`trusted_proxies`](/docs/caddyfile/options#trusted-proxies) is configured:

```caddy
example.com {
	log {
		format filter {
			request>remote_ip ip_mask 16 32
			request>client_ip ip_mask 16 32
		}
	}
}
```


To append a server ID from an environment variable to all log entries, and chain it with a `filter` to delete a header:

```caddy
example.com {
	log {
		format append {
			server_id {env.SERVER_ID}
			wrap filter {
				request>headers>Cookie delete
			}
		}
	}
}
```


<span id="wildcard-logs" /> To write separate log files for each subdomain in a [wildcard site block](/docs/caddyfile/patterns#wildcard-certificates), by overriding `hostnames` for each logger. This uses a [snippet](/docs/caddyfile/concepts#snippets) to avoid repetition:

```caddy
(subdomain-log) {
	log {
		hostnames {args[0]}
		output file /var/log/{args[0]}.log
	}
}

*.example.com {
	import subdomain-log foo.example.com
	@foo host foo.example.com
	handle @foo {
		respond "foo"
	}

	import subdomain-log bar.example.com
	@bar host bar.example.com
	handle @bar {
		respond "bar"
	}
}
```

<span id="multiple-outputs" /> To write the access logs for a particular subdomain to two different files, with different formats (one with [`transform-encoder` plugin <img src="/old/resources/images/external-link.svg" class="external-link">](https://github.com/caddyserver/transform-encoder) and the other with [`json`](#json)). 

This works by overriding the logger name as `foo` in the site block, then including the access logs produced by that logger in the two loggers in global options with `include http.log.access.foo`:

```caddy
{
	log access-formatted {
		include http.log.access.foo
		output file /var/log/access-foo.log
		format transform "{common_log}"
	}

	log access-json {
		include http.log.access.foo
		output file /var/log/access-foo.json
		format json
	}
}

foo.example.com {
	log foo
}
```

<span id="sampling-example" /> To reduce log volume with sampling, for example to keep the first 5 requests per second, then 1 out of every 10 requests thereafter:

```caddy
example.com {
	log {
		sampling {
			interval   1s
			first      5
			thereafter 10
		}
	}
}
```
