document.addEventListener('DOMContentLoaded', function() {
	// Algolia search
	docsearch({
		appId: "VZI00J4D3U",
		apiKey: '1ab8d12c0f99de6c4a04401c9f315c2e',
		indexName: 'caddyserver',
		container: '#search',
	});
});

function moduleDocsPreview(mod, maxLen) {
	if (!mod || !mod.docs) return "";
	let short = truncate(mod.docs, maxLen);
	if (short.indexOf(mod.name) === 0) {
		short = short.substr(mod.name.length).trim();
	}
	return short;
}

function detectPlatform() {
	// assume 32-bit linux, then change OS and architecture if justified
	var os = "linux", arch = "amd64";

	// change os
	if (/Macintosh/i.test(navigator.userAgent)) {
		os = "darwin";
	} else if (/Windows/i.test(navigator.userAgent)) {
		os = "windows";
	} else if (/FreeBSD/i.test(navigator.userAgent)) {
		os = "freebsd";
	} else if (/OpenBSD/i.test(navigator.userAgent)) {
		os = "openbsd";
	}

	// change architecture
	if (os == "darwin" || /amd64|x64|x86_64|Win64|WOW64|i686|64-bit/i.test(navigator.userAgent)) {
		arch = "amd64";
	} else if (/arm64/.test(navigator.userAgent)) {
		arch = "arm64";
	} else if (/ ARM| armv/.test(navigator.userAgent)) {
		arch = "arm";
	}

	// change arm version
	if (arch == "arm") {
		var arm = "7"; // assume version 7 by default
		if (/armv6/.test(navigator.userAgent)) {
			arm = "6";
		} else if (/armv5/.test(navigator.userAgent)) {
			arm = "5";
		}
		arch += arm;
	}

	return [os, arch];
}

// Detect the platform OS, but with an allow-list of values
// and if the value is not allowed, return the default.
function defaultOS(allowed, def) {
	var [os] = detectPlatform();
	return allowed.includes(os) ? os : def;
}
