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
			beginRendering(json.result, moduleID);
		});
	});
} else {
	// populate the module list
	$.get("/api/modules", function(json) {
		var moduleList = json.result;
		
		// wait until the DOM has finished loading before rendering the results
		$(function() {
			$('#module-list-container').show();
			$table = $('#module-list');
			for (modID in moduleList) {
				var val = moduleList[modID];
				
				// refine a short preview of the module's docs
				let shortDoc = truncate(val.doc, 200);
				if (shortDoc && shortDoc.indexOf(modID) === 0) {
					shortDoc = shortDoc.substr(modID.length).trim();
				}
				
				var standard = isStandard(val.type_name);
				var $tr = $('<tr/>');
				$tr.append('<td><a href="./'+modID+'" class="module-link">'+modID+'</a>'+(standard ? '' : ' '+nonStandardFlag)+'</td>');
				$tr.append($('<td/>').text(shortDoc));
				$table.append($tr);
			}
		});
	});
}