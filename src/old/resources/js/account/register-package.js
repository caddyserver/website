$(function() {
	$('form input').first().focus();

	$('form').submit(function(event) {
		$('#submit').prop('disabled', true);

		$.post($(this).prop("action"), $(this).serialize()).done(function() {
			swal({
				icon: "success",
				title: "It's yours",
				text: "Package claimed. Its documentation is now available on our website and you are responsible for maintaining it. Thank you!"
			}).then(function() {
				// TODO: ...
				// window.location = "/account/login";
			});
		}).fail(function(jqxhr, status, error) {
			swal({
				icon: "error",
				title: error,
				content: errorContent(jqxhr)
			});
			$('#submit').prop('disabled', false);
		});

		return false;
	});
});