---
title: log (Caddyfile directive)
---

# log

Enables and configures HTTP request logging (also known as access logs).

## Syntax

```
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

```
output stderr
```

#### stdout

Standard output (console).

```
output stderr
```

#### discard

No output.

```
output discard
```

#### file

A file. By default, log files are rotated ("rolled") to prevent disk space exhaustion.

```
output file <filename> {
	roll_disabled
	roll_size     <size>
	roll_keep     <num>
	roll_keep_for <days>
}
```

- **&lt;filename&gt;** is the path to the log file.
- **roll_disabled** disables log rolling. This can lead to disk space depletion, so only use this if your log files are maintained some other way.
- **roll_size** is the size at which to roll the log file. Default: `100MiB`
- **roll_keep** is how many log files to keep before deleting the oldest ones. Default: `10`
- **roll_keep_for** is how long to keep rolled files. Default: 90 days


#### net

A network socket.

```
output net <address>
```

- **&lt;address&gt;** is the [address](/docs/conventions#network-addresses) to write logs to.



### Format modules

The **format** subdirective lets you customize how logs get encoded (formatted). It appears within a `log` block.

In addition to the syntax for each individual encoder, these common properties can be set on most encoders:

```
{
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

- **message_key** The key for the message field of the log entry. Default: `message`
- **level_key** The key for the level field of the log entry. Default: `level`
- **time_key** The key for the time field of the log entry. Default: `time`
- **name_key** The key for the name field of the log entry (i.e. the name of the logger itself). Default: `name`
- **caller_key** The key for the caller field of the log entry.
- **stacktrace_key** The key for the stacktrace field of the log entry.
- **line_ending** The line endings to use.
- **time_format** The format for timestamps.
- **level_format** The format for levels.

#### console

The console encoder formats the log entry for human readability while preserving some structure.

```
output console
```

#### json

Formats each log entry as a JSON object.

```
output json
```

#### logfmt

Formats each log entry as [logfmt](https://brandur.org/logfmt).

```
output logfmt
```

#### single_field

Writes only a single field from the structure log entry. Useful if one of the fields has all the information you need.

```
output single_field <field_name>
```

- **&lt;field_name&gt;** is the name of the field whose value to use as the log entry.







## Examples

Enable access logging (to the console):

```
log
```

Write logs to a file (with log rolling, which is enabled by default):

```
log {
	output file /var/log/access.log
}
```

Customize log rolling:

```
log {
	output file /var/log/access.log {
		roll_size 1gb
		roll_keep 5
	}
}
```

Use common log format (deprecated, but can be useful for older setups):

```
log {
	format single_field common_log
}
```
