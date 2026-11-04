// Download Beta - Main page
// Same layout as the original download page, but uses vanilla JS
// and the new /api/build endpoint for streaming builds.

function detectPlatform() {
	var os = 'linux', arch = 'amd64';
	if (/Macintosh/i.test(navigator.userAgent)) os = 'darwin';
	else if (/Windows/i.test(navigator.userAgent)) os = 'windows';
	else if (/FreeBSD/i.test(navigator.userAgent)) os = 'freebsd';
	else if (/OpenBSD/i.test(navigator.userAgent)) os = 'openbsd';

	if (os === 'darwin' || /amd64|x64|x86_64|Win64|WOW64|i686|64-bit/i.test(navigator.userAgent)) {
		arch = 'amd64';
	} else if (/arm64/.test(navigator.userAgent)) {
		arch = 'arm64';
	} else if (/ ARM| armv/.test(navigator.userAgent)) {
		arch = 'arm';
		var armVer = /armv6/.test(navigator.userAgent) ? '6'
			: /armv5/.test(navigator.userAgent) ? '5' : '7';
		arch += armVer;
	}
	return [os, arch];
}

function truncate(str, maxLen) {
	if (!str) return '';
	str = str.trim();
	var m = str.match(/\.(\s|$)/);
	var end = m ? m.index + 1 : str.length;
	str = str.substring(0, end);
	return str.length <= maxLen ? str : str.substring(0, maxLen) + '...';
}

function moduleDocsPreview(mod, maxLen) {
	if (!mod || !mod.docs) return '';
	var short = truncate(mod.docs, maxLen);
	if (short.indexOf(mod.name) === 0) {
		short = short.substr(mod.name.length).trim();
	}
	return short;
}

function splitVCSProvider(pkgPath) {
	var providers = ['github.com/', 'bitbucket.org/'];
	for (var i = 0; i < providers.length; i++) {
		if (pkgPath.toLowerCase().indexOf(providers[i]) === 0) {
			return { provider: providers[i], path: pkgPath.slice(providers[i].length) };
		}
	}
	return { provider: '', path: pkgPath };
}

function getBuildParams() {
	var platformStr = document.getElementById('platform').value || 'linux-amd64';
	var parts = platformStr.split('-');
	var os = parts[0], arch = parts[1], arm = parts[2] || '';
	var qs = new URLSearchParams();
	if (os) qs.set('os', os);
	if (arch) qs.set('arch', arch);
	if (arm) qs.set('arm', arm);

	document.querySelectorAll('#optional-packages .package.selected').forEach(function(el) {
		var path = el.querySelector('.package-link').textContent.trim();
		var ver = el.querySelector('input[name=version]');
		if (ver && ver.value.trim()) {
			path += '@' + ver.value.trim();
		}
		qs.append('p', path);
	});

	return qs;
}

// Load packages
fetch('/api/packages').then(function(r) { return r.json(); }).then(function(json) {
	var packageList = json.result || [];
	packageList.sort(function(a, b) { return b.downloads - a.downloads; });

	var preselected = new URL(window.location.href).searchParams.getAll('package');

	function renderWhenReady() {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', render);
		} else {
			render();
		}
	}

	function render() {
		var container = document.getElementById('optional-packages');

		for (var i = 0; i < packageList.length; i++) {
			var pkg = packageList[i];

			var pkgEl = document.createElement('div');
			pkgEl.className = 'package';

			// icon
			var iconEl = document.createElement('div');
			iconEl.className = 'package-icon';
			iconEl.textContent = '\uD83D\uDCE6'; // 📦
			pkgEl.appendChild(iconEl);

			// data container
			var dataEl = document.createElement('div');
			dataEl.className = 'package-data';

			// meta (downloads + version input)
			var metaEl = document.createElement('div');
			metaEl.className = 'package-meta';
			metaEl.innerHTML = '<b>downloads:</b> <span class="package-downloads">' + pkg.downloads + '</span> '
				+ '<b>version:</b> <input type="text" class="package-version-input" name="version" placeholder="latest" title="Any version string recognized by `go get` can be used">';
			dataEl.appendChild(metaEl);

			// package link
			var linkEl = document.createElement('a');
			linkEl.className = 'package-link';
			linkEl.target = '_blank';
			linkEl.title = 'View package repo';
			linkEl.href = pkg.repo || '#';

			var split = splitVCSProvider(pkg.path);
			if (split.provider) {
				var hostSpan = document.createElement('span');
				hostSpan.className = 'package-host';
				hostSpan.textContent = split.provider;
				linkEl.appendChild(hostSpan);
				linkEl.appendChild(document.createElement('br'));
			}
			var nameSpan = document.createElement('span');
			nameSpan.className = 'package-name';
			nameSpan.textContent = split.path;
			linkEl.appendChild(nameSpan);
			dataEl.appendChild(linkEl);

			// modules
			var modulesEl = document.createElement('div');
			modulesEl.className = 'package-modules';

			if (pkg.modules && pkg.modules.length > 0) {
				for (var j = 0; j < pkg.modules.length; j++) {
					var mod = pkg.modules[j];
					var modEl = document.createElement('div');
					modEl.className = 'module';

					var modLink = document.createElement('a');
					modLink.className = 'module-link';
					modLink.target = '_blank';
					modLink.href = '/docs/modules/' + mod.name;
					modLink.title = 'View module details';
					modLink.textContent = mod.name;

					var modDesc = document.createElement('span');
					modDesc.className = 'module-desc';
					modDesc.textContent = moduleDocsPreview(mod, 120);

					modEl.innerHTML = '\uD83D\uDD0C '; // 🔌
					modEl.appendChild(modLink);
					modEl.appendChild(modDesc);
					modulesEl.appendChild(modEl);
				}
			} else {
				modulesEl.className += ' package-no-modules';
				modulesEl.textContent = 'This package does not add any modules to the JSON config structure. Either it is another kind of plugin (such as a config adapter) or this listing is in error.';
			}
			dataEl.appendChild(modulesEl);
			pkgEl.appendChild(dataEl);

			if (preselected.includes(pkg.path)) {
				pkgEl.classList.add('selected');
			}

			container.appendChild(pkgEl);
		}

		updatePage();
	}

	renderWhenReady();
}).catch(function(err) {
	document.addEventListener('DOMContentLoaded', function() {
		document.getElementById('optional-packages').innerHTML =
			'<p style="text-align:center;color:#cc0000;">Failed to load packages. The build server may be unavailable.</p>';
	});
});

document.addEventListener('DOMContentLoaded', function() {
	// auto-detect platform
	var detected = detectPlatform();
	var platformEl = document.getElementById('platform');
	if (platformEl) {
		platformEl.value = detected[0] + '-' + detected[1];
	}
	updatePage();

	var downloadButtonHtml = document.getElementById('download').innerHTML;

	// filter
	document.getElementById('filter').addEventListener('input', function() {
		var q = this.value.trim().toLowerCase();
		var count = 0;
		document.querySelectorAll('.package').forEach(function(el) {
			if (!q) { el.style.display = ''; return; }
			var corpus = el.textContent.toLowerCase();
			if (corpus.indexOf(q) === -1) {
				el.style.display = 'none';
			} else {
				el.style.display = '';
				count++;
			}
		});
		this.classList.toggle('found', q && count > 0);
		this.classList.toggle('not-found', q && count === 0);
		if (!q) { this.classList.remove('found', 'not-found'); }
	});

	// platform change
	document.getElementById('platform').addEventListener('change', updatePage);

	// package selection
	document.getElementById('optional-packages').addEventListener('click', function(e) {
		var pkg = e.target.closest('.package');
		if (!pkg) return;
		// don't toggle if clicking a link or input
		if (e.target.closest('a') || e.target.closest('input')) return;
		pkg.classList.toggle('selected');
		updatePage();

		// update URL
		var newUrl = new URL(window.location.href);
		var currentSelected = newUrl.searchParams.getAll('package');
		newUrl.searchParams.delete('package');
		var pkgPath = pkg.querySelector('.package-link').textContent.trim();
		if (pkg.classList.contains('selected')) {
			if (!currentSelected.includes(pkgPath)) {
				currentSelected.push(pkgPath);
			}
		} else {
			var pos = currentSelected.indexOf(pkgPath);
			if (pos >= 0) currentSelected.splice(pos, 1);
		}
		currentSelected.forEach(function(s) { newUrl.searchParams.append('package', s); });
		history.replaceState({}, document.title, newUrl.toString());
	});

	// download button
	document.getElementById('download').addEventListener('click', function(e) {
		e.preventDefault();
		var btn = document.getElementById('download');
		if (btn.classList.contains('disabled')) return;

		btn.classList.add('disabled');
		btn.innerHTML = '<div class="loader"></div> Starting build...';

		// disable fields
		document.querySelectorAll('.download-bar select, #optional-packages input').forEach(function(el) {
			el.disabled = true;
		});

		var qs = getBuildParams();

		fetch('/api/build?' + qs.toString(), { method: 'POST' })
			.then(function(r) { return r.json(); })
			.then(function(json) {
				if (json.error) {
					alert(json.error.message || 'Build request failed');
					enableFields(btn, downloadButtonHtml);
					return;
				}
				var result = json.result;
				if (result.status === 'complete') {
					// already cached -- go straight to download
					window.location.href = '/api/build/' + result.key + '/download';
					enableFields(btn, downloadButtonHtml);
					return;
				}
				// navigate to build progress page
				window.location.href = '/download-beta/build/?key=' + result.key;
			})
			.catch(function(err) {
				alert('Failed to start build: ' + err.message);
				enableFields(btn, downloadButtonHtml);
			});
	});

	function enableFields(btn, originalHtml) {
		btn.classList.remove('disabled');
		btn.innerHTML = originalHtml;
		document.querySelectorAll('.download-bar select, #optional-packages input').forEach(function(el) {
			el.disabled = false;
		});
	}
});

function updatePage() {
	var count = document.querySelectorAll('.package.selected').length;
	var el = document.getElementById('package-count');
	if (el) el.textContent = count;

	// show/hide darwin warning
	var platformVal = document.getElementById('platform').value || '';
	var darwinWarn = document.getElementById('darwin-warning');
	if (darwinWarn) darwinWarn.style.display = platformVal.indexOf('darwin') === 0 ? '' : 'none';
}
