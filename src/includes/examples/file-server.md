<script>
ready(() => {
	let startElement, endElement;

	startElement = findWithContent('.ex-fs pre.chroma code span.line', 'file_server /downloads/* {');
	endElement = findNextText(startElement, '}');
	wrapRangeWithSpan(startElement, endElement, 'rollover-compress rollover-blue');

	startElement = findWithContent('.ex-fs pre.chroma code span', 'encode');
	endElement = findNextText(startElement, 'gzip');
	wrapRangeWithSpan(startElement, endElement, 'rollover-compress rollover-blue');

	startElement = findWithContent('.ex-fs pre.chroma code span.line', 'file_server /database/* {');
	endElement = findNextText(startElement, '}');
	wrapRangeWithSpan(startElement, endElement, 'rollover-vfs rollover-green');

	startElement = findWithContent('.ex-fs pre.chroma code span.line', 'file_server /embedded/* {');
	endElement = findNextText(startElement, '}');
	wrapRangeWithSpan(startElement, endElement, 'rollover-vfs rollover-green');

	startElement = findWithContent('.ex-fs pre.chroma code span', '# (Range/Etag/etc. all work without extra config)');
	wrapRangeWithSpan(startElement, startElement, 'rollover-range rollover-yellow');

	startElement = findWithContent('.ex-fs pre.chroma code span', 'file_server');
	endElement = findNextText(startElement, 'browse');
	wrapRangeWithSpan(startElement, endElement, 'rollover-browse rollover-purple');

	window.$_('.ex-fs code').classList.add('light');
});
</script>

<div class="ex-fs">

```caddy
example.com

root * /var/www

# Serve precompressed files if present
file_server /downloads/* {
	precompressed
}

# Compress everything else that would benefit
encode zstd gzip

# Static site using database as file system
file_server /database/* {
	fs sqlite data.sql 
}

# Static site embedded within the Caddy binary
file_server /embedded/* {
	fs embedded
}

# (Range/Etag/etc. all work without extra config)

# Serve static site with directory listings
file_server browse
```

</div>
