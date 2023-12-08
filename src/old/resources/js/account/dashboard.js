// download package list as soon as possible
$.get("/api/user-packages").done(function(json) {
	var packageList = json.result;
	
	// wait until the DOM has finished loading before rendering the results
	$(function() {
		// trying out this fancy new syntax:
		// https://twitter.com/joshmanders/status/1282395540970496001
		packageList.forEach(pkg => {
			var $tdPath = $('<td><input type="text" name="path" maxlength="255"></td>');
			var $tdListed = $('<td class="text-center"><input type="checkbox" name="listed"></td>');
			var $tdAvail = $('<td class="text-center"><input type="checkbox" name="available"></td>');
			var $tdDownloads = $('<td>0</td>');
			var $tdLinks = $('<td><a href="javascript:" class="rescan-package">Rescan</a> &nbsp; <a href="javascript:" class="delete-package">Delete</a></td>');

			if (pkg.listed) {
				$('input', $tdListed).prop('checked', true);
			}
			if (pkg.available) {
				$('input', $tdAvail).prop('checked', true);
			}
			if (pkg.downloads) {
				$tdDownloads.text(pkg.downloads);
			}
			var $pathInput = $('input', $tdPath);
			$pathInput.val(pkg.path).attr('size', pkg.path.length);

			var $tr = $('<tr data-package-id="'+pkg.id+'"></tr>');
			$tr.append($tdPath)
				.append($tdListed)
				.append($tdAvail)
				.append($tdDownloads)
				.append($tdLinks);

			$('#user-packages').append($tr);

			// scroll package paths to the left so if they get
			// cut off, the leaf package name is still visible
			$pathInput.scrollLeft($pathInput.width());
		});
	});
});

$(function() {

	// update packages when fields change
	$('#user-packages').on('change', 'input', function() {
		$tr = $(this).closest('tr');
		$('input', $tr).prop('disabled', true);
		$.post('/api/update-package', {
			id: $tr.data('package-id'),
			listed: $('[name=listed]', $tr).prop('checked') ? 1 : 0,
			available: $('[name=available]', $tr).prop('checked') ? 1 : 0,
			path: $('[name=path]', $tr).val()
		}).fail(function(jqxhr, status, error) {
			swal({
				icon: "error",
				title: "Could not save changes",
				content: errorContent(jqxhr)
			});
		}).always(function() {
			$('input', $tr).prop('disabled', false);
		});
	});

	// rescan package
	$('#user-packages').on('click', '.rescan-package', function() {
		if ($(this).hasClass('disabled')) return;
		
		$tr = $(this).closest('tr');
		$('a', $tr).addClass('disabled');

		$.post('/api/rescan-package', {
			package_id: $tr.data('package-id')
		}).done(function(jqxhr, status, error) {
			swal({
				icon: "success",
				title: "Rescan Complete",
				text: "Package has been re-scanned and its documentation has been updated."
			});
		}).fail(function(jqxhr, status, error) {
			swal({
				icon: "error",
				title: "Rescan failed",
				content: errorContent(jqxhr)
			});
		}).always(function() {
			$('a', $tr).removeClass('disabled');
		});
	});

	// delete package
	$('#user-packages').on('click', '.delete-package', function() {
		if ($(this).hasClass('disabled')) return;

		swal({
			title: "Delete package?",
			text: "Deleting the package will remove it from our website.",
			icon: "warning",
			buttons: true,
			dangerMode: true,
		}).then((willDelete) => {
			// abort if user cancelled
			if (!willDelete) return;

			$tr = $(this).closest('tr');
			$('input', $tr).prop('disabled', true);
			$.post('/api/delete-package', {
				id: $tr.data('package-id')
			}).done(function(jqxhr, status, error) {
				$tr.remove();
				swal({
					icon: "success",
					title: "Package deleted"
				});
			}).fail(function(jqxhr, status, error) {
				swal({
					icon: "error",
					title: "Delete failed",
					content: errorContent(jqxhr)
				});
			}).always(function() {
				$('input', $tr).prop('disabled', false);
			});
		});
	});
	
});