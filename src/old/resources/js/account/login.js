if (loggedIn()) window.location = '/account/';

$(function() {
	$('form input').first().focus();

	$('form').submit(function(event) {
		$('#submit').prop('disabled', true);

		$.post($(this).prop("action"), $(this).serialize()).done(function() {
			var qsParams = new URLSearchParams(window.location.search);
			var destination = qsParams.get('redir');
			window.location = destination ? destination : '/account/';
		}).fail(function(jqxhr, msg, error) {
			swal({
				icon: "error",
				title: "Bad credentials",
				content: errorContent(jqxhr)
			});
			$('#submit').prop('disabled', false);
		});
		
		return false;
	});
});