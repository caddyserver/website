const jsonDocsPathPrefix = "/docs/json/";

var configPath = window.location.pathname.substr(jsonDocsPathPrefix.length-1); // keep trailing slash
var pathComponents = configPath.split('/');

setPageTitle();

// load the docs for this path
$.get("/api/docs/config"+configPath, function(json) {
	// wait until the DOM has finished loading before rendering the results
	$(function() {
		beginRenderingInto($('#json-docs-container'), '', json.result);

		// establish the breadcrumb
		var $bc = $('.breadcrumbs');
		$('<a href="'+jsonDocsPathPrefix+'" id="top-breadcrumb">JSON Config Structure</a> &rsaquo;').appendTo($bc);
		for (var i = 1; i < pathComponents.length-1; i++) {
			var bcPath = pathComponents.slice(0, i+1).join('/');
			var bcSiblingPath = pathComponents.slice(1, i).join('/');
			
			// enclosing with span is a hack so jQuery treats this as a HTML DOM object
			$('<span> &rsaquo; <a href="'+jsonDocsPathPrefix+bcPath.substr(1)+'/" class="breadcrumb has-popup" data-sibling-path="'+bcSiblingPath+'">'+pathComponents[i]+'</a></span>').appendTo($bc);
		}

		// re-trigger the URL fragment if any, to scroll to the archor
		var fragment = window.location.hash;
		if (fragment) {
			window.location.hash = '';
			window.location.hash = fragment;
		}
	});
});

function setPageTitle() {
	// set the page title with something useful
	var parts = configPath.split("/");
	if (parts.length > 1) {
		if (!parts[0]) {
			parts.shift();
		}
		if (!parts[parts.length-1]) {
			parts.pop();
		}
		var titlePrefix = parts.slice(-2).join("/");
		if (parts.length > 4) {
			titlePrefix = parts.slice(0, 2).join("/")+"/.../"+titlePrefix;
		}
		if (titlePrefix) {
			document.title = titlePrefix + " - " + document.title;
		}
	}
}
