// Common account utilities - loaded on all account pages

// Check if user is admin and show admin nav link
(function() {
	// Try to check admin access silently
	fetch('/api/admin/check-access')
		.then(response => response.json())
		.then(data => {
			if (data.is_admin) {
				const adminLink = document.getElementById('admin-nav-link');
				if (adminLink) {
					adminLink.style.display = '';
				}
			}
		})
		.catch(() => {
			// Silently ignore - user is not admin or not logged in
		});
})();
