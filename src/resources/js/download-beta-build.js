// Download Beta - Build progress page
// Connects to SSE at /api/build/{key}/events and shows live progress.
// Auto-downloads the artifact on completion.

var STEP_LABELS = {
	'create_environment': 'Setting up build environment',
	'initialize_module':  'Initializing Go module',
	'pin_versions':       'Downloading dependencies',
	'windows_resources':  'Generating Windows resources',
	'tidy_module':        'Resolving modules',
	'compile':            'Compiling',
	'cleanup':            'Cleaning up',
};

var STEP_ORDER = [
	'create_environment',
	'initialize_module',
	'pin_versions',
	'tidy_module',
	'compile',
	'cleanup',
];

function getStepProgress(step) {
	var idx = STEP_ORDER.indexOf(step);
	if (idx === -1) return 0;
	return Math.round(((idx + 1) / STEP_ORDER.length) * 100);
}

document.addEventListener('DOMContentLoaded', function() {
	var params = new URLSearchParams(window.location.search);
	var key = params.get('key');

	if (!key) {
		showError('No build key provided.');
		return;
	}

	var downloadUrl = '/api/build/' + key + '/download';
	document.getElementById('download-link').href = downloadUrl;

	// connect to SSE
	var evtSource = new EventSource('/api/build/' + key + '/events');
	var logEl = document.getElementById('build-log');
	var logContainer = document.getElementById('build-log-container');

	evtSource.addEventListener('step', function(e) {
		try {
			var data = JSON.parse(e.data);
			var label = STEP_LABELS[data.step] || data.step;
			document.getElementById('current-step').textContent = label + '...';
			document.getElementById('progress-fill').style.width = getStepProgress(data.step) + '%';
		} catch(err) {}
	});

	evtSource.addEventListener('log', function(e) {
		try {
			var data = JSON.parse(e.data);
			if (data.line) {
				logEl.textContent += data.line + '\n';
				logContainer.scrollTop = logContainer.scrollHeight;
			}
		} catch(err) {}
	});

	evtSource.addEventListener('result', function(e) {
		evtSource.close();
		try {
			var data = JSON.parse(e.data);
			if (data.success) {
				showSuccess(downloadUrl);
			} else {
				showError(data.error || 'Build failed.');
			}
		} catch(err) {
			showError('Failed to parse build result.');
		}
	});

	evtSource.onerror = function() {
		evtSource.close();
		// check if build completed while we were disconnected
		fetch(downloadUrl, { method: 'HEAD' }).then(function(r) {
			if (r.ok) {
				showSuccess(downloadUrl);
			} else {
				showError('Lost connection to the build server.');
			}
		}).catch(function() {
			showError('Lost connection to the build server.');
		});
	};
});

function showSuccess(downloadUrl) {
	document.getElementById('build-title').textContent = 'Build Complete';
	document.getElementById('build-subtitle').textContent = '';
	document.getElementById('progress-fill').style.width = '100%';
	document.getElementById('current-step').textContent = 'Done';

	document.getElementById('build-result').classList.remove('hidden');
	document.getElementById('result-success').classList.remove('hidden');

	// auto-download via hidden link
	var a = document.createElement('a');
	a.href = downloadUrl;
	a.download = '';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function showError(msg) {
	document.getElementById('build-title').textContent = 'Build Failed';
	document.getElementById('build-subtitle').textContent = '';
	document.getElementById('progress-fill').style.width = '0%';
	document.getElementById('current-step').textContent = '';

	document.getElementById('build-result').classList.remove('hidden');
	document.getElementById('result-error').classList.remove('hidden');
	document.getElementById('error-message').textContent = msg;
}
