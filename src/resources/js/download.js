// download package list as soon as possible
$.get("/api/packages").done(function(json) {
	var packageList = json.result;
	
	// wait until the DOM has finished loading before rendering the results
	$(function() {
		const optpkgTemplate =
			'<tr class="optpkg">'+
			'	<td><label><input type="checkbox"><span class="optpkg-name"></span></label></td>'+
			'	<td class="text-center"><input type="text" name="version" placeholder="latest" title="Package version" size="5"></td>'+
			'	<td class="optpkg-modules"></td>'+
			'</tr>';

		const optpkgModuleTemplate =
			'<div class="optpkg-module">'+
			'	<a class="module-name" title="View docs"></a>'+
			'	<span class="module-description"></span>'+
			'</div>';		

		for (var i = 0; i < packageList.length; i++) {
			var pkg = packageList[i];
			if (isStandard(pkg.path)) {
				// not necessary to show, since these packages
				// come with standard distribution
				continue;
			}
			
			var $optpkg = $(optpkgTemplate);
			$('.optpkg-name', $optpkg).text(pkg.path);

			if (pkg.modules && pkg.modules.length > 0) {
				for (var j = 0; j < pkg.modules.length; j++) {
					var mod = pkg.modules[j];
					var $mod = $(optpkgModuleTemplate);
					$('.module-name', $mod).attr('href', '/docs/modules/'+mod.name).text(mod.name);
					$('.module-description', $mod).text(truncate(mod.docs, 120));
					$('.optpkg-modules', $optpkg).append($mod);
				}
			} else {
				$('.optpkg-modules', $optpkg)
					.addClass("optpkg-no-modules")
					.text('This package does not add any modules. Either it is another kind of plugin (such as a config adapter) or this listing is in error.');
			}
			$('#optional-packages').append($optpkg);
		}
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

	// update the page, including the download link, when form fields change
	$('#optional-packages').on('change', 'input[type=checkbox]', function() {
		$(this).closest('.optpkg').toggleClass('selected');
		updatePage();
	});
	$('#optional-packages').on('change keyup', 'input[name=version]', function() {
		updatePage();
	});
	$('#platform').change(function() {
		updatePage();
	});

	$('#download').click(function(event) {
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
		var p = $('.optpkg-name', this).text().trim();

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
	$('#package-count').text($('.optpkg.selected').length);
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

var downloadButtonHtml; // to restore button to its original contents