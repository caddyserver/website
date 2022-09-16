---
title: map (Caddyfile directive)
---

# map

Sets values of custom placeholders switched on an input value.

It compares the source value against the input side of the map, and for one that matches, it applies the output value(s) to each destination. Destinations become placeholder names. Default output values may also be specified for each destination.

Mapped placeholders are not evaluated until they are used, so even for very large mappings, this directive is quite efficient.

## Syntax

```caddy-d
map [<matcher>] <source> <destinations...> {
	[~]<input> <outputs...>
	default    <defaults...>
}
```

- **&lt;source&gt;** is the input value to switch on. Usually a placeholder.

- **&lt;destinations...&gt;** are the placeholders to create that hold the output values.

- **&lt;input&gt;** is the input value to match. If prefixed with `~`, it is treated as a regular expression.

- **&lt;outputs...&gt;** is one or more output values to store in the associated placeholder. The first output is written to the first destination, the second output to the second destination, etc.
  
  As a special case, the Caddyfile parser treats outputs that are a literal hyphen (`-`) as null/nil values. This is useful if you want to fall back to a default value for that particular output in the case of the given input, but want to use non-default values for other outputs.

  The outputs will be type converted if possible; `true` and `false` will be converted to boolean types, and numeric values will be converted to integer or float accordingly. To avoid this conversion, you may wrap the output with [quotes](/docs/caddyfile/concepts#tokens-and-quotes) and they will stay strings.

  The number of outputs for each mapping must not exceed the number of destinations; however, for convenience, there may be fewer outputs than destinations, and any missing outputs will be filled in implicitly.
  
  If a regular expression was used as the input, then the capture groups can be referenced with `${group}` where `group` is either the name or number of the capture group in the expression. Capture group `0` is the full regexp match, `1` is the first capture group, `2` is the second capture group, and so on.

- **&lt;default&gt;** specifies the output values to store if no inputs are matched.


## Examples

The following example demonstrates most aspects of this directive:

```caddy-d
map {host}                {my_placeholder}  {magic_number} {
	example.com           "some value"      3
	foo.example.com       "another value"
	~(.*)\.example\.com$  "${1} subdomain"  5

	~.*\.net$             -                 7
	~.*\.xyz$             -                 15

	default               "unknown domain"  42
}
```

This directive switches on the value of `{host}`, i.e. the domain name of the request.

- If the request is for `example.com`, set `{my_placeholder}` to `some value`, and `{magic_number}` to `3`.
- Else, if the request is for `foo.example.com`, set `{my_placeholder}` to `another value`, and let `{magic_number}` default to `42`.
- Else, if the request is for any subdomain of `example.com`, set `{my_placeholder}` to a string containing the value of the first regexp capture group, i.e the entire subdomain, and set `{magic_number}` to 5.
- Else, if the request is for any host that ends in `.net` or `.xyz`, set only `{magic_number}` to `7` or `15`, respectively. Leave `{my_placeholder}` unset.
- Else (for all other hosts), the default values will apply: `{my_placeholder}` will be set to `unknown domain` and `{magic_number}` will be set to `42`.
