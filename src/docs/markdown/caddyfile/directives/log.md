---
title: log (Caddyfile directive)
---

# log

Enables and configures HTTP request logging (also known as access logs).

## Syntax

```caddy-d
log {
	output <writer_module> ...
	format <encoder_module> ...
	level  <level>
}
```

- **output** configures a where to write the logs to. See [Output modules](#output-modules) below. Default: `stderr`
- **format** describes how to encode, or format, the logs. See [Format modules](#format-modules) below. Default `console`
- **level** is the minimum entry level to log. Default: `INFO`

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

A network socket.

```caddy-d
output net <address>
```

- **&lt;address&gt;** is the [address](/docs/conventions#network-addresses) to write logs to.



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

#### logfmt

Formats each log entry as [logfmt](https://brandur.org/logfmt).

```caddy-d
format logfmt
```

#### single_field

Writes only a single field from the structure log entry. Useful if one of the fields has all the information you need.

```caddy-d
format single_field <field_name>
```

- **&lt;field_name&gt;** is the name of the field whose value to use as the log entry.







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

Use common log format (deprecated, but can be useful for older setups):

```caddy-d
log {
	format single_field common_log
}
```
