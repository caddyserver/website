const moduleDocsPathPrefix = "/docs/modules/";

var moduleID = window.location.pathname.substr(moduleDocsPathPrefix.length);
if (moduleID) {
	// update page title and load the docs for these modules (possibly more than 1 with this ID)
	document.title = "Module " + moduleID + " - Caddy Documentation";
	$.get("/api/docs/module/"+moduleID, function(json) {
		var modules = json.result;

		// wait until the DOM has finished loading before rendering the results
		$(function() {
			$('#module-docs-container').show();
			$('.module-name').text("Module "+moduleID);
			modules.forEach((module) => {
				$tpl = $('#module-template').clone().attr('id', stripScheme(module.repo));
				if (modules.length > 1) {
					$('article', $tpl).hide();
				}
				beginRenderingInto($tpl, moduleID, module);
				$('#module-docs-container').append($tpl);
			});
			if (modules.length > 1) {
				$('#module-multiple-repos .module-name').text(moduleID);
				$('#module-multiple-repos').show();
			} else {
				$('.module-repo-selector').hide();
			}

			// if a specific repo's module is wanted, expand and scroll to it
			if (window.location.hash.length > 1) {
				// TODO: weird bug in jQuery(??) that it can't select IDs with slashes in them, so we use vanilla JS
				var container = document.getElementById(window.location.hash.substr(1));
				$('.module-repo-selector', container).click();
				container.scrollIntoView();
			}
		});
	});

	$(function() {
		$('body').on('click', '.module-repo-selector', function() {
			if ($(this).hasClass('expanded')) {
				// collapse
				$('.module-repo-selector-arrow', this).html('&#9656;');
			} else {
				// expand
				$('.module-repo-selector-arrow', this).html('&#9662;');
			}
			$(this).toggleClass('expanded');
			$(this).next('article').toggle();
		});
	});
} else {
	// populate the module list
	$.get("/api/modules", function(json) {
		var moduleList = json.result;

		console.log("MODULE LIST:", moduleList);
		
		// wait until the DOM has finished loading before rendering the results
		$(function() {
			$('#module-list-container').show();
			$table = $('#module-list');
			for (modID in moduleList) {
				var infos = moduleList[modID];
				
				infos.forEach((info) => {
					// refine a short preview of the module's docs
					let shortDoc = truncate(info.docs, 200);
					if (shortDoc && shortDoc.indexOf(modID) === 0) {
						shortDoc = shortDoc.substr(modID.length).trim();
					}

					let modLink = "./"+modID;
					if (infos.length > 1) {
						modLink += "#"+stripScheme(info.repo);
					}
					
					var standard = isStandard(info.package);
					var $tr = $('<tr/>');
					$tr.append('<td>'+(standard ? standardFlag : nonStandardFlag)+'</td>');
					var $tdLink = $('<td><a href="'+modLink+'" class="module-link">'+modID+'</a></td>');
					if (infos.length > 1) {
						$tdLink.append($('<div class="module-repo-differentiator">').text('('+stripScheme(info.repo)+')'));
					}
					$tr.append($tdLink);
					$tr.append($('<td/>').text(shortDoc));
					$table.append($tr);
				});
			}
		});
	});
}
