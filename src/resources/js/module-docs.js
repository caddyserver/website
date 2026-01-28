const moduleDocsPathPrefix = "/docs/modules/";

if (window.location.pathname == moduleDocsPathPrefix.slice(0, -1) 
	|| window.location.pathname.startsWith(moduleDocsPathPrefix)) {
	let moduleID = window.location.pathname.slice(moduleDocsPathPrefix.length);
	if (moduleID) {
		// update page title and load the docs for these modules (possibly more than 1 with this ID)
		document.title = `Module ${moduleID} - Caddy Documentation`;
		fetch(`/api/docs/module/${moduleID}`)
			.then(response => response.json())
			.then(function(json) {
				const modules = json.result;
				// wait until the DOM has finished loading before rendering the results
				ready(function() {
					$_('#module-docs-container').style.display = 'block';
					$_('.module-name').innerText = `Module ${moduleID}`;
					modules.forEach((module) => {
						$tpl = $_('#module-template').cloneNode(true);
						$tpl.id = stripScheme(module.repo);
						if (modules.length > 1) {
							$_('article', $tpl).style.display = 'none';
						}
						beginRenderingInto($tpl, moduleID, module);
						$_('#module-docs-container').append($tpl);
					});
					if (modules.length > 1) {
						$_('#module-multiple-repos .module-name').innerText = moduleID;
						$_('#module-multiple-repos').style.display = 'block';
					} else {
						$_('.module-repo-selector', $tpl).style.display = 'none';
					}

					// if a specific repo's module is wanted, expand and scroll to it
					if (window.location.hash.length > 1) {
						var container = document.getElementById(window.location.hash.slice(1));
						$_('.module-repo-selector', container).click();
						container.scrollIntoView();
					}
				});
			});

		ready(function() {
			on('click', '.module-repo-selector', function(event) {
				const $selectorEl = event.target.closest('.module-repo-selector');
				if (event.target.classList.contains('expanded')) {
					$_('.module-repo-selector-arrow', $selectorEl).innerHTML = '&#9656;'; // collapse
				} else {
					$_('.module-repo-selector-arrow', $selectorEl).innerHTML = '&#9662;'; // expand
				}
				$selectorEl.classList.toggle('expanded');
				const $articleElem = next($selectorEl, 'article');
				$articleElem.style.display = $articleElem.style.display == 'none' ? 'block' : 'none';
			});
		});
	} else {
		// populate the module list
		fetch(`/api/modules`)
			.then(response => response.json())
			.then(function(json) {
				const moduleList = json.result;
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

							let modLink = window.location.pathname +"/"+modID;
							if (infos.length > 1) {
								modLink += "#"+stripScheme(info.repo);
							}
							
							let standard = isStandard(info.package);
							let $tr = document.createElement('tr');
							$tr.innerHTML += `<td>${(standard ? standardFlag : nonStandardFlag)}</td>`;
							let $tdLink = `<td><a href="${modLink}" class="module-link">${modID}</a>`;
							if (infos.length > 1) {
								$tdLink += `<div class="module-repo-differentiator">(${stripScheme(info.repo)})</div>`;
							}
							$tr.innerHTML += $tdLink+"</td>";
							$tr.innerHTML += `<td>${shortDoc}</td>`;
							$table.append($tr);
						});
					}
				});
			});
	}
}
