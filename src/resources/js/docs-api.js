// TODO: sanitize all HTML renderings, especially markdown: https://github.com/cure53/DOMPurify

var pageDocs = {};
var pageData = {};
var $hovercard;

const nonStandardFlag = '<span class="nonstandard-flag" title="This module does not come with official Caddy distributions by default; it needs to be added to custom Caddy builds.">Non-standard</span>';
const standardFlag = '<span class="standard-flag" title="This module comes with official Caddy distributions by default.">Standard</span>';

ready(function() {
	$hovercard = $_('#hovercard');
	if (!$hovercard) {
		return;
	}

	let hoverTimeout;
	$hovercard.addEventListener('mouseover', function() {
		clearTimeout(hoverTimeout);
	});
	$hovercard.addEventListener('mouseleave', function() {
		clearTimeout(hoverTimeout);
		$hovercard.classList.remove('popup');
	});

	on('mouseenter', '.has-popup', function(event) {
		// don't allow hoverbox to close anymore, we're re-opening it
		clearTimeout(hoverTimeout);

		var moduleID = event.target.closest('.module-repo-container')?.dataset.moduleId || '';
		var moduleData = pageData[moduleID];

		var pos = {
			top: event.target.getBoundingClientRect().top + window.scrollY,
			left: event.target.getBoundingClientRect().left + window.scrollX
		};

		// there is a gap between the hoverbox and the link that originated it;
		// there may be a different link in this gap; if the hover box is visible,
		// then we should ignore the hover on this link to allow cursor to visit
		// the hoverbox if that is where it is going; this makes it possible to
		// visit the hoverbox while it is over a list of links that are tightly
		// stacked vertically; if user wants to visit hoverbox for link in this
		// gap, they can just move the cursor slow enough to fire the timeout
		// or move the cursor a roundabout way to get the hovercard to disappear
		if ($hovercard.classList.contains('popup') && $hovercard.getBoundingClientRect().top + window.scrollY - 10 < pos.top) {
			return;
		}

		// fill out hovercard

		var elemPath = event.target.dataset.path;
		var modNamespace = event.target.dataset.namespace;

		$$_('.hovercard-elem').forEach(elem => elem.style.display = 'none');

		if (event.target.classList.contains('module')) {
			// module
			var $list = document.createElement('div');
			if (moduleData.namespaces && moduleData.namespaces[modNamespace]) {
				for (var i = 0; i < moduleData.namespaces[modNamespace].length; i++) {
					var modInfo = moduleData.namespaces[modNamespace][i];
					var href = canTraverse(moduleData) ? `${window.location.pathname}${elemPath}/${modInfo.name}` : `${jsonDocsPathPrefix}/${modNamespace}.${modInfo.name}`;
					var content = `<a href="${href}" class="module-link"> ${modInfo.name}`;
					if (!isStandard(modInfo.package)) {
						content += nonStandardFlag;
					}
					content += `<span class="module-link-description">${truncate(modInfo.docs, 115)}</span></a>`;
					$list.innerHTML += content;
				}
			}
			$_('#hovercard-module-list').replaceChildren($list);
			$_('#hovercard-namespace').innerText = modNamespace;
			$_('#hovercard-module').style.display = 'block';
			
		} else if (event.target.classList.contains('module-inline-key')) {
			// inline key
			$_('#hovercard-inline-key').style.display = 'block';
			
		} else if (event.target.classList.contains('breadcrumb')) {
			// breadcrumb siblings
			
			var siblingPath = event.target.dataset.siblingPath;
			var bcVal = moduleData.breadcrumb[siblingPath];
			var bcSiblings = [];

			// drill down to the true underlying type
			while (bcVal.elems) {
				bcVal = bcVal.elems;
			}
			
			switch (bcVal.type) {
			case "struct":
				for (var j = 0; j < bcVal.struct_fields.length; j++) {
					var sf = bcVal.struct_fields[j];
					bcSiblings.push({name: sf.key, path: siblingPath, isStandard: isStandard(bcVal.type_name)})
				}
				break;
			case "module":
			case "module_map":
				for (var j = 0; j < moduleData.namespaces[bcVal.module_namespace].length; j++) {
					var mod = moduleData.namespaces[bcVal.module_namespace][j];
					bcSiblings.push({name: mod.name, path: siblingPath, isStandard: isStandard(mod.package)})
				}
			}

			var $siblings = document.createElement('div');
			$siblings.classList.add('breadcrumb-siblings');
			$siblings.innerHTML = `<div class="breadcrumb-siblings-title">Siblings:</div>`;
			for (var j = 0; j < bcSiblings.length; j++) {
				var sib = bcSiblings[j];
				var sibPath = sib.path;
				if (sibPath) {
					sibPath += "/";
				}
				sibPath += sib.name;
				var aTag = `<a href="${jsonDocsPathPrefix+sibPath}"`;
				if (!sib.isStandard) {
					aTag += ' class="nonstandard" title="Non-standard module"';
				}
				aTag += `>${sib.name}</a>`;
				$siblings.innerHTML += aTag;
			}
			$_('#hovercard-breadcrumb-siblings').replaceChildren($siblings);
			$_('#hovercard-breadcrumb-siblings').style.display = 'block';

		} else if (event.target.classList.contains('documented')) {
			// docs
			var elemDocs = truncate(pageDocs[elemPath], 500);
			if (!elemDocs) {
				elemDocs = `<p class="explain">There are no docs for this property.</p>`;
				return;
			}
			$_('#hovercard-docs').innerHTML = markdown(elemDocs);
			$_('#hovercard-docs').style.display = 'block';
			$_('#hovercard-inline-link').innerHTML = `<a href="#${elemPath.substr(1)}">View docs below &#8595;</a>`;
			$_('#hovercard-inline-link').style.display = 'block';
		}

		// show hoverbox for this link
		var height = event.target.getBoundingClientRect().height;
		var linkWidth = event.target.getBoundingClientRect().width;
		var boxWidth = $hovercard.getBoundingClientRect().width;
		$hovercard.style.top = pos.top + height*1.5 + 10 + 'px'; // '+10' counters 'translateY(-10px)' from the CSS
		$hovercard.style.left = pos.left + linkWidth/2 - boxWidth/2 + 'px';
		$hovercard.classList.add('popup');
	}, true);

	on('mouseleave', '.has-popup', function() {
		// don't hide the hoverbox right away; user might need a
		// few milliseconds to get the cursor over the hovercard
		hoverTimeout = setTimeout(function() {
			$hovercard.classList.remove('popup');
		}, 200);
	}, true);
});

function beginRenderingInto($tpl, moduleID, module) {
	$tpl.dataset.moduleId = moduleID;
	pageData[moduleID] = module;

	// show notice if module is non-standard
	if (module.repo) {
		if (!isStandard(module.structure.type_name)) {
			let { pkg, _ } = splitTypeName(module.structure.type_name);
			$_('.nonstandard-project-link', $tpl).href = module.repo;
			$_('.nonstandard-project-link', $tpl).innerText = module.repo;
			$_('.nonstandard-package-path', $tpl).innerText = pkg;
			$_('.nonstandard-notice', $tpl).style.display = 'block';
			$_('.nonstandard-notice', $tpl).innerHTML = nonStandardFlag + $_('.nonstandard-notice', $tpl).innerHTML;
		}

		const moduleRepoSelector = $_('.module-repo-selector', $tpl);
		if (moduleRepoSelector) {
			moduleRepoSelector.innerHTML = `
				<span class="module-repo-selector-arrow">&#9656;</span>
				<span>${stripScheme(module.repo)}</span>`;
		}
	}

	// for most types, just render their docs; but for maps or arrays, fall through to underlying type for docs
	let rawDocs = module.structure.doc ?? module.structure.elems;

	$_('.top-doc', $tpl).innerHTML = markdown(replaceGoTypeNameWithCaddyModuleName(rawDocs, module, moduleID));
	$_('.top-doc', $tpl).innerHTML += makeSubmoduleList(module, "", module.structure);

	let $group = newGroup();
	renderData($tpl, module, module.structure, 0, "", $group);
	$_('.renderbox', $tpl).append($group);

	if ($_('.field-list-contents', $tpl).innerText.trim()) {
		$_('.field-list-header', $tpl).style.display = 'block';
	}

	// TODO: see about fixing this for module and JSON docs pages
	// // if the browser tried to navigate directly to an element
	// // on the page when it loaded, it would have failed since
	// // we hadn't rendered it yet; but now we can scroll to it
	// // directly since rendering has finished
	// if (window.location.hash.length > 1) {
	// 	document.getElementById(window.location.hash.substr(1)).scrollIntoView();
	// }
}


function renderData($tpl, module, data, nesting, path, $group) {
	switch (data.type) {
	case "struct":
		$group.innerHTML += `{<a href="javascript:" class="toggle-obj expanded" title="Collapse/expand">&#9662;</a>`;
		nesting++;

		var $fieldGroup = newGroup();
		renderModuleInlineKey($tpl, module, data, nesting, $fieldGroup);
		$group.append($fieldGroup);
		if (data.struct_fields) {
			// TODO: Not sure if sorting the struct fields is a good idea...
			// data.struct_fields.sort(function(a, b) {
			// 	if (a.key > b.key) return 1;
			// 	if (b.key > a.key) return -1;
			// 	return 0;
			// });
			for (var i = 0; i < data.struct_fields.length; i++) {
				var field = data.struct_fields[i];
				var fieldPath = pathJoin(path, field.key);
				var cleanFieldPath = fieldPath.slice(1); // trim leading slash

				// store the docs for this path
				let linkClass = "documented";
				if (field.doc) {
					pageDocs[fieldPath] = field.doc;
					linkClass += " has-popup";
				}

				// render the docs to the page
				var fieldDoc = markdown(field.doc) || `<p class="explain">There are no docs for this property.</p>`;
				fieldDoc += makeSubmoduleList(module, fieldPath, field.value);
				appendToFieldDocs($tpl, module, cleanFieldPath, fieldDoc);

				// render the field to the JSON box
				var $fieldGroup = newGroup();
				indent(nesting, $fieldGroup);
				var keyATag = '<a ';
				if (canTraverse(module)) {
					keyATag += `href="${pathJoin(window.location.pathname, fieldPath)}" `;
				}
				keyATag += `data-path="${fieldPath}" class="${linkClass}">${field.key}</a>`;
				$fieldGroup.innerHTML += `<span class="qu">"</span><span class="key">${keyATag}</span><span class="qu">"</span>: `;
				renderData($tpl, module, field.value, nesting, fieldPath, $fieldGroup);
				if (i < data.struct_fields.length-1) {
					$fieldGroup.innerHTML += ',';
				}
				$group.append($fieldGroup);
			}
		}
		nesting--;
		indent(nesting, $group);
		$group.innerHTML += `<span class="end-obj">}</span>`;
		break;

	case "bool":
		$group.innerHTML += `<span class="bool">false</span>`; // TODO: default value?
		break;

	case "int":
	case "uint":
	case "float":
	case "complex":
		$group.innerHTML += `<span class="num">0</span>`; // TODO: default value?
		break;

	case "string":
		$group.innerHTML += `<span class="qu">"</span><span class="str"></span><span class="qu">"</span>`; // TODO: default value?
		break;

	case "array":
		$group.innerHTML += '[';
		if (data.elems.type == "module_map") {
			$group.innerHTML += `{<a href="${pathJoin(jsonDocsPathPrefix, path)}" class="module has-popup" data-namespace="${(data.elems.module_namespace || '')}" data-path="${path}">&bull;&bull;&bull;</a>}`;
		} else {
			renderData($tpl, module, data.elems, nesting, path, $group);
		}
		$group.innerHTML += ']';
		break;

	case "map":
		$group.innerHTML += `{\n`;
		nesting++;
		renderModuleInlineKey($tpl, module, data, nesting, $group);
		indent(nesting, $group);
		renderData($tpl, module, data.map_keys, nesting, path, $group);
		$group.innerHTML += ': ';
		renderData($tpl, module, data.elems, nesting, path, $group);
		$group.innerHTML += '\n';
		nesting--;
		indent(nesting, $group);
		$group.innerHTML += '}';
		break;

	case "module":
	case "module_map":
		var aTag = '<a';
		if (canTraverse(module)) {
			aTag += ` href="${jsonDocsPathPrefix}${path}"`;
		}
		aTag += ` class="module has-popup" data-namespace="${(data.module_namespace || '')}" data-path="${path}">&bull;&bull;&bull;</a>`;
		$group.innerHTML += `{${aTag}}`;
		break;
	}
}

function renderModuleInlineKey($tpl, module, data, nesting, $group) {
	if (!data.module_inline_key) {
		return
	}
	var moduleName = pathComponents[pathComponents.length-2];
	indent(nesting, $group);
	$group.innerHTML += `<span class="qu">"</span><span class="key module-inline-key has-popup">${data.module_inline_key}</span><span class="qu">"</span>: <span class="qu">"</span><span class="str"><b>${moduleName}</b></span><span class="qu">"</span>`;
	if (data.struct_fields && data.struct_fields.length > 0) {
		$group.innerHTML != ',';
	}
	$group.innerHTML += '\n';

	appendToFieldDocs($tpl, module, data.module_inline_key, $_('#hovercard-inline-key').innerHTML);
}

function appendToFieldDocs($tpl, module, cleanFieldPath, fieldDoc) {
	var dt = cleanFieldPath;
	if (canTraverse(module)) {
		dt = `<a href="${pathJoin(window.location.pathname, cleanFieldPath)}">${dt}</a>`;
	}
	$_('.field-list-contents', $tpl).innerHTML += `<dt class="field-name" id="${cleanFieldPath}"><a href="#${cleanFieldPath}" class="inline-link">&#128279;</a>${dt}</dt> <dd>${fieldDoc}</dd>`;
}

function indent(nesting, $group) {
	var $span = document.createElement('span');
	$span.classList.add("indent");
	$span.innerText = '\t'.repeat(nesting);
	$group.append($span);
}

function makeSubmoduleList(module, path, value) {
	while (value.elems) {
		value = value.elems;
	}
	if (value.type != "module" && value.type != "module_map") {
		return '';
	}
	var submodList = '<ul>';
	if (module.namespaces && module.namespaces[value.module_namespace]) {
		module.namespaces[value.module_namespace].sort(function(a, b){
			if(isStandard(a.package) && !isStandard(b.package)) return -1;
			if(!isStandard(a.package) && isStandard(b.package)) return 1;
			if(a.name < b.name) return -1;
			if(a.name > b.name) return 1;
			return 0;
		});
		for (var j = 0; j < module.namespaces[value.module_namespace].length; j++) {
			var submod = module.namespaces[value.module_namespace][j];
			var href = canTraverse(module) ? pathJoin(window.location.pathname, path+"/"+submod.name) : pathJoin(window.location.pathname, value.module_namespace+"."+submod.name);
			var submodLink = `<a href="${href}">${submod.name}</a>`;
			if (!isStandard(submod.package)) {
				submodLink += ' '+nonStandardFlag;
			}
			submodList += '<li>'+submodLink+'</li>';
		}
	}
	submodList += '</ul>';
	return `<div><p>Fulfilled by modules in namespace: <b>${value.module_namespace}</b></p>${submodList}</div>`;
}

// canTraverse returns true if the page data
// includes breadcrumbs; i.e. we are on a page
// that can traverse the JSON structure, not
// only render part of it in isolation.
function canTraverse(data) {
	return data.breadcrumb != null;
}

function newGroup() {
	const div = document.createElement('div');
	div.classList.add("group");
	return div;
}

function replaceGoTypeNameWithCaddyModuleName(docs, module, moduleID) {
	if (!docs || !moduleID) return docs;

	// fully qualified type name
	let fqtn = module.structure.type_name;

	// extract just the local type name
	let {_, typeName} = splitTypeName(fqtn);

	// replace the type name with the Caddy module ID if it starts the docs.
	if (docs.indexOf(typeName) === 0) {
		docs = moduleID + docs.substr(typeName.length);
	}

	return docs;
}

function pathJoin(p1, p2) {
	if (p2.startsWith('/')) {
		p2 = p2.slice(1);
	}
	if (p1.endsWith('/')) {
		p1 = p1.slice(0, -1);
	}
	return p1+"/"+p2;	
}

function markdown(input) {
	if (!input) {
		return "";
	}
	return marked.parse(input);
}