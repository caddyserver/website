const moduleDocsPathPrefix = "/docs/modules/";

let moduleID = window.location.pathname.substr(moduleDocsPathPrefix.length);
if (moduleID) {
	// update page title and load the docs for these modules (possibly more than 1 with this ID)
	document.title = `Module ${moduleID} - Caddy Documentation`;
	fetch(`/api/docs/module/${moduleID}`)
		.then(response => response.json())
		.then(function(modules) {
		// wait until the DOM has finished loading before rendering the results
		ready(function() {
			$_('#module-docs-container').style.display = 'block';
			$_('.module-name').text("Module "+moduleID);
			modules.forEach((module) => {
				$tpl = $_('#module-template').clone().attr('id', stripScheme(module.repo));
				if (modules.length > 1) {
					$_('article', $tpl).style.display = 'none';
				}
				beginRenderingInto($tpl, moduleID, module);
				$_('#module-docs-container').append($tpl);
			});
			if (modules.length > 1) {
				$_('#module-multiple-repos .module-name').text(moduleID);
				$_('#module-multiple-repos').style.display = 'block';
			} else {
				$_('.module-repo-selector').style.display = 'none';
			}

			// if a specific repo's module is wanted, expand and scroll to it
			if (window.location.hash.length > 1) {
				var container = document.getElementById(window.location.hash.substr(1));
				$_('.module-repo-selector', container).click();
				container.scrollIntoView();
			}
		});
	});

	$_(function() {
		$_('body').on('click', '.module-repo-selector', function() {
			if ($_(this).hasClass('expanded')) {
				// collapse
				$_('.module-repo-selector-arrow', this).html('&#9656;');
			} else {
				// expand
				$_('.module-repo-selector-arrow', this).html('&#9662;');
			}
			$_(this).toggleClass('expanded');
			$_(this).next('article').toggle();
		});
	});
} else {
	// populate the module list
	fetch(`/api/modules`)
		.then(response => response.json())
		.then(function(moduleList) {
		console.log("MODULE LIST:", moduleList);
		
		// wait until the DOM has finished loading before rendering the results
		ready(function() {
			$_('#module-list-container').style.display = 'block';
			$table = $_('#module-list');
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
					
					let standard = isStandard(info.package);
					let $tr = document.createElement('tr');
					$tr.innerHTML += `<td>${(standard ? standardFlag : nonStandardFlag)}</td>`;
					let $tdLink = `<td><a href="${modLink}" class="module-link">${modID}</a></td>`;
					if (infos.length > 1) {
						$tdLink += `<div class="module-repo-differentiator">(${stripScheme(info.repo)})</div>`;
					}
					$tr.innerHTML += $tdLink;
					$tr.innerHTML += `<td>${shortDoc}</td>`;
					$table.append($tr);
				});
			}
		});
	});
}
