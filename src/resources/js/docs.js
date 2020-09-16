$(function() {
	function hasPrefix(str, prefix) {
		if (!prefix) return true;
		if (!str)    return false;
		return str.indexOf(prefix) === 0;
	}

	// highlight current page in left nav
	var $currentPageLink = $('main nav a[href="'+window.location.pathname+'"]');
	if (hasPrefix(window.location.pathname, "/docs/json/")) {
		// as a special case, highlight the JSON structure link anywhere within it
		$currentPageLink = $('main nav a[href="/docs/json/"]');
	}
	if (hasPrefix(window.location.pathname, "/docs/modules/")) {
		// as another special case, highlight the modules link anywhere within it
		$currentPageLink = $('main nav a[href="/docs/modules/"]');
	}
	$currentPageLink.addClass('current');

	// add anchor links, inspired by https://github.com/bryanbraun/anchorjs
	$('article > h1[id], article > h2[id], article > h3[id], article > h4[id], article > h5[id], article > h6[id]').each(function() {
		var $anchor = $('<a href="#'+this.id+'" class="anchor-link" title="Direct link">🔗</a>');
		$(this).append($anchor);
	});

	// the server-side markdown renderer annoyingly renders
	// colored code blocks differently from plain ones, in that
	// colorized ones do not have the additional <code> inside
	// the <pre>; this line finds those and adds a .chroma class
	// to the outer pre element, and our CSS file has a style to
	// ensure the inner code block does not produce extra padding
	$('article > pre:not(.chroma) > code:not(.cmd)').parent().addClass('chroma');

	// Add links to Caddyfile directive tokens in code blocks.
	// See include/docs-head.html for the whitelist bootstrapping logic
	$('pre.chroma .k')
		.filter(function (k, item) {
			return window.CaddyfileDirectives.includes(item.innerText)
				|| item.innerText === '<directives...>';
		})
		.map(function(k, item) {
			let text = item.innerText;
			let url = text === '<directives...>'
				? '/docs/caddyfile/directives'
				: '/docs/caddyfile/directives/' + text;
			$(item)
				.html('<a href="' + url + '" style="color: inherit;"></a>')
				.find('a')
				.text(text);
		});

	// Add links to [<matcher>] or named matcher tokens in code blocks.
	// We can't do it exactly the same as the above block, because
	// the matcher text includes <> character which are parsed as HTML
	// unless we use text() to change the link text.
	$('pre.chroma .nd')
		.map(function(k, item) {
			let text = item.innerText;
			$(item)
				.html('<a href="/docs/caddyfile/matchers" style="color: inherit;"></a>')
				.find('a')
				.text(text);
		});
});