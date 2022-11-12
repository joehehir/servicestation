const inject = require('./inject');
const reader = require('./reader');
const { to } = require('../util');

module.exports = async (internal, path) => {
    if (path.endsWith('/index.js')) {
        const script = (src) => ({
            // TODO? https://w3c.github.io/ServiceWorker/#service-worker-allowed
            headers: {
                'content-length': new TextEncoder().encode(src).byteLength,
                'content-type': 'text/javascript',
            },
            src,
        });

        if (path === `${internal}index.js`) {
            return script(`(${inject.internal})();\n(${inject.activate})();\n`);
        }

        const decoded = decodeURI(path);
        const [err, index] = await to(reader(`/var/www${decoded}`));
        if (err) throw err;

        return script(`${index}\n(${inject.override})();\n(${inject.activate})();\n`);
    }

    if (path.endsWith('/')) {
        const src = '<!DOCTYPE html><title>index</title>';

        return {
            headers: {
                'content-length': new TextEncoder().encode(src).byteLength,
                'content-type': 'text/html',
            },
            src,
        };
    }

    return undefined;
};
