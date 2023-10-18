const BASE_API_PATH = '/api';
const pkgURL = `${BASE_API_PATH}/packages`;
const downloadURL = `${BASE_API_PATH}/download`;

class Package {
    /**
     * @typedef {Object} Module
     * @property {string} docs
     * @property {string} name
     * @property {string} package
     * @property {string} repo
     */

    /**
     * @typedef {Object} Pkg
     * @property {string} id
     * @property {string} path
     * @property {string} published
     * @property {boolean} listed
     * @property {boolean} available
     * @property {number} downloads
     * @property {ReadonlyArray<Module>} modules
     * @property {string} repo
     * @property {string} name
     */

    /** 
     * @type {ReadonlyArray<Pkg>}
     */
    packages = [];

    /** 
     * @type {string}
     */
    filter = '';

    /**
     * @returns Promise<>
     */
    getPackages() {
        return fetch(pkgURL, { headers: { 'X-Requested-With': 'XMLHttpRequest', Origin: 'https://caddyserver.com' } })
            .then(res => res.json())
            .then(({ result }) => this.packages = result.sort((a, b) => a.downloads - b.downloads).map(item => ({ ...item, description: item.modules?.map(m => m.docs ?? m.name).join('\n') ?? '', name: item.repo.split('/')[4].toLowerCase() })));
    }

    setFilterValue(value) {
        this.filter = value;
    }

    getSearchPackages(pkgs) {
        if (!this.filter) {
            return pkgs;
        }

        return pkgs.filter(pkg => pkg.name.includes(this.filter) || pkg.repo.includes(this.filter) || pkg.description.includes(this.filter));
    }

    /**
     * @param {'alphabetically' | 'type' | 'download'} groupBy
     * @return {
     *   Record<string, Pkg> | ReadonlyArray<Pkg}
     */
    group(groupBy = 'alphabetically') {
        const pkgs = this.getSearchPackages(this.packages);
        switch (groupBy) {
            case 'alphabetically':
                return pkgs.sort((a, b) => a.name.localeCompare(b.name));
            case 'download':
                return pkgs.sort((a, b) => b.downloads - a.downloads);
            case 'type':
                return pkgs.reduce((acc, current) => {
                    if (!current?.modules?.length) {

                        return acc;
                    }

                    current.modules.forEach(module => {
                        let moduleName = module.name
                        if (module.name.includes('.')) {
                            const splitted = module.name.split('.')
                            moduleName = `${splitted[0]}.${splitted[1]}`
                        }
                        if (acc[moduleName]) {
                            acc[moduleName] = [...acc[moduleName], current];
                        }
                    })

                    return acc;
                }, {
                    "http.handlers": [],
                    "http.matchers": [],
                    "dns.providers": [],
                    "http.encoders": [],
                    "caddy.config_loaders": [],
                    "caddy.fs": [],
                    "caddy.listeners": [],
                    "caddy.logging.encoders": [],
                    "caddy.logging.encoders.filter": [],
                    "caddy.logging.writers": [],
                    "caddy.storage": [],
                    "events.handlers": [],
                    "http.authentication.hashes": [],
                    "http.authentication.providers": [],
                    "http.ip_sources": [],
                    "http.precompressed": [],
                    "http.reverse_proxy.circuit_breakers": [],
                    "http.reverse_proxy.selection_policies": [],
                    "http.reverse_proxy.transport": [],
                    "http.reverse_proxy.upstreams": [],
                    "tls.certificates": [],
                    "tls.client_auth": [],
                    "tls.handshake_match": [],
                    "tls.issuance": [],
                    "tls.get_certificate": [],
                    "tls.stek": [],
                })
        }
    }
}

const packageManager = new Package();

const params = new URLSearchParams(window.location.search?.slice(1));
let versions = params.getAll('p').reduce((acc, current) => {
    [p, v] = current.split('@');

    acc[p] = v ?? '';

    return acc;
}, {});

function togglePackage({ target: { dataset: { module } } }) {
    const element = document.getElementById('packages').querySelector(`button[data-module="${module}"]`);
    if (module in versions) {
        delete versions[module];
        const countVersions = Object.keys(versions).length;
        if (!countVersions) {
            modulesCount.innerHTML = '';
        } else {
            modulesCount.innerHTML = `with ${countVersions} extra module${countVersions > 1 ? 's' : ''}`;
        }

        element.innerHTML = "Add this module";
    } else {
        versions[module] = '';
        const countVersions = Object.keys(versions).length;
        element.innerHTML = "Remove this module";
        modulesCount.innerHTML = `with ${countVersions} extra module${countVersions > 1 ? 's' : ''}`;
    }

    setDownloadLink();
}

function setDownloadLink() {
    document.getElementById('command-builder').innerText = getCommand();
    document
        .getElementById('download-link')
        .setAttribute('href', `${downloadURL}?${new URLSearchParams(Object.entries(versions).map(([p, v]) => ['p', `${p}${!!v ? `@${v}` : ''}`])).toString()}`);
}

function getCommand() {
    return `xcaddy build${Object.entries(versions ?? {}).map(([p, v]) => ` --with ${p}${!!v ? `@${v}` : ''}`).join('')}`
}

function copyCommand() {
    navigator.clipboard.writeText(getCommand())
}

function renderList(list) {
    if (groupBy === 'type') {
        const groupedData = Object.entries(packageManager.group(groupBy)).filter(([_, items]) => !!items.length)
        document.getElementById('side-panel-packages').innerHTML = `
<div>
<h2 class="blue">Namespaces</h2>
${groupedData.map(([k]) => `<a href="#${k}"> ${k}</a>`).join('')}
</div>`;
        document.getElementById('packages').innerHTML = groupedData.map(([category, items]) => `
<section id="${category}">
<h2 class="blue">${category}</h2>
<div class="card-list">${items.map(item => getCardTemplate({ ...item, state: versions[item.path] })).join('')}</div>
</section>`).join('')
        return;
    }

    document.getElementById('side-panel-packages').innerHTML = '';
    document.getElementById('packages').innerHTML = `
<div class="card-list">
${list.map(item => getCardTemplate({ ...item, state: versions[item.path] })).join('')}
</div>`;
};

packageManager.getPackages().then(() => {
    renderList(packageManager.group(groupBy));
    const countVersions = Object.keys(versions).length;
    modulesCount.innerHTML = countVersions ? `with ${countVersions} extra module${countVersions > 1 ? 's' : ''}` : '';
    setDownloadLink();
})

function updateVersion({ target: { value } }, pkg) {
    versions[pkg] = value;
    setDownloadLink();
}
