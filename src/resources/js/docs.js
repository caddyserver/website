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
	$currentPageLink.addClass('current');

	// Enable anchor links using https://github.com/bryanbraun/anchorjs
	anchors.add();
});