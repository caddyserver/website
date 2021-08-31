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
		.filter((k, item) =>
			window.CaddyfileDirectives.includes(item.innerText)
				|| item.innerText === '<directives...>'
		)
		.map(function(k, item) {
			let text = item.innerText;
			let url = text === '<directives...>'
				? '/docs/caddyfile/directives'
				: '/docs/caddyfile/directives/' + text;
			text = text.replace(/</g,'&lt;').replace(/>/g,'&gt;');
			$(item).html('<a href="' + url + '" style="color: inherit;" title="Directive">' + text + '</a>');
		});

	// Add links to [<matcher>] or named matcher tokens in code blocks.
	// The matcher text includes <> characters which are parsed as HTML,
	// so we must use text() to change the link text.
	$('pre.chroma .nd')
		.map(function(k, item) {
			let text = item.innerText.replace(/</g,'&lt;').replace(/>/g,'&gt;');
			$(item).html('<a href="/docs/caddyfile/matchers#syntax" style="color: inherit;" title="Matcher token">' + text + '</a>');
		});
});

// addLinkaddLinksToSubdirectivessToAnchors finds all the ID anchors
// in the article, and turns any directive or subdirective span into
// links that have an ID on the page. This is opt-in for each page,
// because it's not necessary to run everywhere.
function addLinksToSubdirectives() {
	let anchors = $('article *[id]').map((i, el) => el.id).toArray();
	$('pre.chroma .k')
		.filter((k, item) => anchors.includes(item.innerText))
		.map(function(k, item) {
			let text = item.innerText.replace(/</g,'&lt;').replace(/>/g,'&gt;');
			let url = '#' + item.innerText;
			$(item).html('<a href="' + url + '" style="color: inherit;" title="' + text + '">' + text + '</a>');
		});
}

function stripScheme(url) {
	return url.substring(url.indexOf("://")+3);
}

// splitTypeName splits a fully qualified type name into
// its package path and type name components, for example:
// "github.com/foo/bar.Type" => "github.com/foo/bar" and "Type".
function splitTypeName(fqtn) {
	let lastDotPos = fqtn.lastIndexOf('.');
	let pkg = fqtn.substr(0, lastDotPos);
	let typeName = fqtn.substr(lastDotPos+1);
	return {pkg: pkg, typeName: typeName};
}
