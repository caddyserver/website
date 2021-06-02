// download package list as soon as possible
$.get("/api/packages").done(function(json) {
	// sort package list by most popular, seems to make sense for convenience
	var packageList = json.result;
	packageList.sort((a, b) => {
		return b.downloads > a.downloads ? 1 : -1;
	});

	const preselectedPackage = new URL(window.location.href).searchParams.getAll("package");
	
	// wait until the DOM has finished loading before rendering the results
	$(function() {
		const packageTemplate =
			'<div class="package">\n'+
			'	<div class="package-icon">&#128230;</div>\n'+
			'   <div class="package-data">\n'+
			'		<div class="package-meta">\n'+
			'			<b>downloads:</b> <span class="package-downloads"></span>\n'+
			'			<b>version:</b> <input type="text" class="package-version-input" name="version" placeholder="latest" title="Any version string recognized by `go get` can be used">\n'+
			'		</div>\n'+
			'		<a target="_blank" title="View package repo" class="package-link"></a>\n'+
			'		<div class="package-modules"></div>\n'+
			'	</div>\n'+
			'</div>\n'

		const moduleTemplate =
			'<div class="module">\n'+
			'	&#128268; <a target="_blank" title="View module docs" class="module-link"></a>\n'+
			'	<span class="module-desc"></span>\n'+
			'</div>\n';


		for (var i = 0; i < packageList.length; i++) {
			var pkg = packageList[i];

			var $pkg = $(packageTemplate);
			
			let { provider, path } = splitVCSProvider(pkg.path);
			if (provider) {
				var $pkgHost = $('<span class="package-host"/>').text(provider);
				$('.package-link', $pkg).html($pkgHost).append('<br/>');
			}
			$pkgName = $('<span class="package-name"/>').text(path);
			
			$('.package-link', $pkg).append($pkgName);
			$('.package-link', $pkg).prop('href', pkg.repo);
			$('.package-downloads', $pkg).text(pkg.downloads);
			if (preselectedPackage.includes(pkg.path)) {
				$($pkg).addClass("selected");
			}

			if (pkg.modules && pkg.modules.length > 0) {
				for (var j = 0; j < pkg.modules.length; j++) {
					var mod = pkg.modules[j];
					var $mod = $(moduleTemplate);
					// TODO: if this module name collides with that from another package, add a #hash to the URL to expand the right module's docs automatically
					$('.module-link', $mod).attr('href', '/docs/modules/'+mod.name).text(mod.name).attr('title', "View module details");
					$('.module-desc', $mod).text(moduleDocsPreview(mod, 120));
					$('.package-modules', $pkg).append($mod);
				}
			} else {
				$('.package-modules', $pkg)
					.addClass("package-no-modules")
					.text('This package does not add any modules to the JSON config structure. Either it is another kind of plugin (such as a config adapter) or this listing is in error.');
			}
			$('#optional-packages').append($pkg);
		}
		updatePage();
	});
}).fail(function(jqxhr, status, error) {
	swal({
		icon: "error",
		title: "Unavailable",
		content: $('<div>Sorry, the build server is down for maintenance right now. You can try again later or <a href="https://github.com/caddyserver/caddy/releases/latest">download pre-built Caddy binaries from GitHub</a> any time.</div>')[0]
	});
	$(function() {
		disableFields(false);
	});
});

$(function() {
	autoPlatform();

	downloadButtonHtml = $('#download').html();

	$('#filter').on('search keyup', function(event) {
		var count = 0;
		var q = $(this).val().trim().toLowerCase();

		$('.package').each(function() {
			if (!q) {
				// filter is cleared; show all
				this.style.display = '';
				return;
			}
			
			var corpus = $(this).find('.package-link, .module-link, .module-desc').text().trim().toLowerCase();

			if (corpus.indexOf(q) === -1) {
				this.style.display = 'none'; 
				return;
			}
			this.style.display = '';
			count++;
		});

		// update color of search input based on results
		if (q) {
			if (count > 0) {
				$('#filter').addClass('found').removeClass('not-found');
			} else {
				$('#filter').addClass('not-found').removeClass('found');
			}
		} else {
			$('#filter').removeClass('found not-found');
		}
	});

	$('#platform').change(function() {
		updatePage();
	});

	$('#optional-packages').on('click', '.package', function() {
		$(this).toggleClass('selected');
		updatePage();

		let newUrl = new URL(window.location.href);
		let currentSelected = newUrl.searchParams.getAll("package") ;
		newUrl.searchParams.delete("package");
		const pkgPath = $('.package-link', $(this)).text().trim(); 
		if ($(this).hasClass('selected')) {
			if (!currentSelected.includes(pkgPath)) {
				currentSelected = [...currentSelected, pkgPath];
			}
		} else {
			const position = currentSelected.indexOf(pkgPath);
			if (position >= 0) {
				currentSelected.splice(position, 1);
			}
		}
		currentSelected.forEach( (selected) => newUrl.searchParams.append("package", selected));
		history.replaceState({}, document.title, newUrl.toString());
	});

	// when a link within a package listing is clicked, only operate the link (don't select the package)
	$('#optional-packages').on('click', '.package-link, .module-link, .package-version-input', function(event) {
		event.stopPropagation();
	});

	$('#download').click(function() {
		if ($(this).hasClass('disabled')) {
			return false;
		}

		disableFields(true);

		fathom.trackGoal('U9K2UTFV', 0);

		$.ajax($(this).attr('href'), { method: "HEAD" }).done(function(data, status, jqxhr) {
			window.onbeforeunload = null; // disable exit confirmation before "redirecting" to download
			window.location = jqxhr.getResponseHeader("Location");
		}).fail(function(jqxhr, status, error) {
			handleBuildError(jqxhr, status, error);
		}).always(function() {
			enableFields();
		});
	
		return false;
	});
})

// autoPlatform choooses the platform in the list that best
// matches the user's browser, if it's available.
function autoPlatform() {
	// assume 32-bit linux, then change OS and architecture if justified
	var os = "linux", arch = "386", arm = "";

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
		arm = "7"; // assume version 7 by default
		if (/armv6/.test(navigator.userAgent)) {
			arm = "6";
		} else if (/armv5/.test(navigator.userAgent)) {
			arm = "5";
		}
	}

	var selString = os+"-"+arch;
	if (arm != "") {
		selString += "-"+arm;
	}

	$('#platform').val(selString);
	updatePage();
}

function getDownloadLink() {
	// get platform components
	var platformParts = $('#platform').val().split("-");
	var os = platformParts[0];
	var arch = platformParts[1];
	var arm = platformParts.length > 2 ? platformParts[2] : "";

	var qs = new URLSearchParams();
	if (os)   qs.set("os", os);
	if (arch) qs.set("arch", arch);
	if (arm)  qs.set("arm", arm);

	// get plugins and their versions
	$('#optional-packages .selected').each(function() {
		// get package path
		var p = $('.package-link', this).text().trim();

		// get package version, if user specified one
		var ver = $('input[name=version]', this).val().trim();
		if (ver) {
			p += "@"+ver;
		}

		qs.append("p", p);
	});

	var idempotencyKey = Math.floor(Math.random() * 99999999999999);
	qs.append("idempotency", idempotencyKey);

	return "/api/download?"+qs.toString();
}

function handleBuildError(jqxhr, status, error) {
	var $content = $('<div class="swal-custom-content">');

	if (jqxhr.status == 502) {
		swal({
			icon: "error",
			title: "Unavailable",
			content: $content.html('Sorry, the build server is down for maintenance right now. You can try again later or <a href="https://github.com/caddyserver/caddy/releases/latest">download pre-built Caddy binaries from GitHub</a>.')[0]
		});
	} else {
		swal({
			icon: "error",
			title: "Build failed",
			content: $content.html('The two most common reasons are:<ol><li><b>A plugin is not compiling.</b> The developer must release a new version that compiles.</li><li><b>The build configuration is invalid.</b> If you specified any versions, make sure they are correct and <a href="https://golang.org/cmd/go/#hdr-Module_compatibility_and_semantic_versioning" target="_blank">within the same major version</a> as the path of the associated package.</li></ol>In the meantime, you can <a href="https://github.com/caddyserver/caddy/releases/latest">download Caddy from GitHub</a> without any plugins.')[0]
		});
	}
}

function updatePage() {
	$('#package-count').text($('.package.selected').length);
	$('#download').attr('href', getDownloadLink());
}

function disableFields(building) {
	$('#download, #optional-packages').addClass('disabled');
	$('.download-bar select, #optional-packages input').prop('disabled', true);
	if (building) {
		$('#download').html('<div class="loader"></div> Building');

		// prevent accidentally leaving the page during a build
		window.onbeforeunload = function() {
			return "Your custom build is in progress.";
		};
	} else {
		$('#download').html('Builds Unavailable');
	}
}

function enableFields() {
	$('#download, #optional-packages').removeClass('disabled');
	$('.download-bar select, #optional-packages input').prop('disabled', false);
	$('#download').html(downloadButtonHtml);

	// allow user to leave page easily
	window.onbeforeunload = null;
}

function splitVCSProvider(pkgPath) {
	var providers = ["github.com/", "bitbucket.org/"];
	for (var i = 0; i < providers.length; i++) {
		if (pkgPath.toLowerCase().indexOf(providers[i]) == 0) {
			return {
				provider: providers[i],
				path:     pkgPath.slice(providers[i].length)
			};
		}
	}
	return {provider: "", path: pkgPath};
}

var downloadButtonHtml; // to restore button to its original contents
