---
title: fs (Caddyfile directive)
---

# fs

Sets which file system should be used for performing file I/O.

This could let you connect to a remote filesystem running in the cloud, or a database with a file-like interface, or even to read from files embedded within the Caddy binary.

First, you must declare a file system name using the [`filesystem` global option](/docs/caddyfile/options#filesystem), then you can use this directive to specify which file system to use.

This directive is often used in conjunction with the [`file_server` directive](file_server) to serve static files, or the [`try_files` directive](try_files) to perform rewrites based on the existence of files. Typically also used with [`root` directive](root) to set the root path within the file system.


## Syntax

```caddy-d
fs [<matcher>] <filesystem>
```

## Examples

Using an file system named `foo`, using an imaginary module named `custom` which might require authentication:

```caddy
{
	filesystem foo custom {
		api_key abc123
	}
}

example.com {
	fs foo
	root /srv
	file_server
}
```

To only serve images from the `foo` file system, and the rest from the default file system:

```caddy
example.com {
	fs /images* foo
	root /srv
	file_server
}
```
