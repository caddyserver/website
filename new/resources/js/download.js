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

    /** @type {string} */
    pkgURL = "https://localhost/api/packages";

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
        return fetch(this.pkgURL, { headers: { 'X-Requested-With': 'XMLHttpRequest', Origin: 'https://caddyserver.com' } })
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

let packages = [];
function togglePackage({ target: { dataset: { module } } }) {
    const element = document.getElementById('packages').querySelector(`button[data-module="${module}"]`);
    if (packages.includes(module)) {
        packages = packages.filter(p => p !== module);
        if (!packages.length) {
            modulesCount.innerHTML = '';
        } else {
            modulesCount.innerHTML = `with ${packages.length} extra module${packages.length > 1 ? 's' : ''}`;
        }

        element.innerHTML = "Add this module";
    } else {
        packages.push(module);
        element.innerHTML = "Remove this module";
        modulesCount.innerHTML = `with ${packages.length} extra module${packages.length > 1 ? 's' : ''}`;
    }

    document.getElementById('command-builder').innerText = `xcaddy build${packages.map(p => ` --with ${p}`).join('')}`
}

function copyCommand() {
    navigator.clipboard.writeText(`xcaddy build${packages.map(s => ` --with ${s}`).join('')}`)
}