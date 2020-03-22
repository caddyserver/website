const moduleDocsPathPrefix = "/docs/modules/";

var moduleID = window.location.pathname.substr(moduleDocsPathPrefix.length);
if (moduleID) {
	// update page title and load the docs for this module
	document.title = "Module " + moduleID + " - Caddy Documentation";
	$.get("/api/docs/module/"+moduleID, function(json) {
		// wait until the DOM has finished loading before rendering the results
		$(function() {
			$('#module-docs-container').show();
			$('h1').text("Module "+moduleID);
			beginRendering(json);
		});
	});
} else {
	// populate the module list
	$.get("/api/modules", function(moduleList) {
		// wait until the DOM has finished loading before rendering the results
		$(function() {
			$('#module-list-container').show();
			$table = $('#module-list');
			for (modID in moduleList) {
				var doc = moduleList[modID];
				var $tr = $('<tr/>');
				$tr.append('<td><a href="./'+modID+'" class="module-link">'+modID+'</a></td>');
				$tr.append('<td>'+markdown(truncate(doc, 200))+'</td>');
				$table.append($tr);
			}
		});
	});
}