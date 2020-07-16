document.addEventListener('DOMContentLoaded', function() {
	// Algolia search
	docsearch({
		apiKey: '14275a785f6ebd31d162f9d2d8fc0125',
		indexName: 'caddyserver',
		inputSelector: '#search',
		debug: false // Set debug to true if you want to inspect the dropdown
	});
});

const caddyImportPath = 'github.com/caddyserver/caddy/v2';

function isStandard(packagePath) {
	return packagePath.startsWith(caddyImportPath);
}

function substrBeforeLastDot(s) { 
	return s.substr(0, s.lastIndexOf('.'))
}

function substrAfterLastDot(s) { 
	return s.substr(s.lastIndexOf('.'))
}

function truncate(str, len) {
	if (!str) return "";
	var startLen = str.length;
	str = str.substring(0, len);
	if (startLen > len) {
		str += "...";
	}
	return str;
}
