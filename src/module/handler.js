const { ACCESS_LOG } = require('process').env;
const refetch = require('./script/refetch');
const stream = require('./stream');
const {
    is,
    stderr,
    stdout,
    throwable,
} = require('./util');

const status = {
    404: 'Not Found',
    500: 'Internal Server Error',
    504: 'Gateway Timeout',
};

module.exports = (host, scopes, mapping, timeout) => {
    const routing = new RegExp(`^${scopes.join('|^').replace('/', '\\/')}`);

    // regexp naive pattern match
    const router = (path) => {
        const match = path.match(routing);
        return (match?.[0])
            ? mapping.get(match[0])
            : undefined;
    };

    const log = (request, code) => {
        if (!is(ACCESS_LOG)) return;

        const addr = request.headers?.['x-forwarded-for']?.match(/[^,]+/)?.[0]
            || request.socket?.remoteAddress
            || '-';
        const ua = request.headers?.['user-agent']
            || '-';

        stdout(`${addr} "${request.method} ${request.url}" ${code} "${ua}"`);
    };

    return async (request, response) => {
        request.socket.ref();

        const path = request.url.match(/[^?#]+/)?.[0];
        const decoded = throwable(decodeURI, path);

        // prefer decoded path
        const page = router((decoded instanceof Error) ? path : decoded);
        if (page === undefined) {
            response.writeHead(404).end(status[404], () => {
                log(request, 404);
                request.socket.unref();
            });
            return;
        }

        const init = {
            credentials: 'same-origin',
            method: request.method,
            mode: 'same-origin',
            redirect: 'follow',
        };

        if (request.headers) init.headers = request.headers;

        // preserve set-cookie headers
        if (Array.isArray(request.headers?.['set-cookie'])) {
            init.headers['set-cookie'] = request.headers['set-cookie'].join(';').replace(/;+/g, ';');
        }

        // preserve user-agent header
        if (request.headers?.['user-agent']) {
            init.headers['x-user-agent'] = request.headers['user-agent'];
        }

        if (/PATCH|POST|PUT/i.test(request.method)) {
            const buffer = await stream(request).catch((err) => err);
            if (buffer instanceof Error) {
                response.writeHead(500).end(status[500], () => {
                    log(request, 500);
                    stderr(buffer);
                    request.socket.unref();
                });
                return;
            }

            // serialize for Page.evaluate
            init.body = Array.from(buffer);
        }

        const ret = await Promise.race([
            page.evaluate(refetch, `${host}${request.url}`, init).catch((err) => err),
            new Promise((r) => {
                setTimeout(() => r(new Error(status[504])), timeout);
            }),
        ]);
        if (ret instanceof Error) {
            const code = (ret.message === status[504])
                ? 504
                : 500;

            response.writeHead(code).end(status[code], () => {
                log(request, code);
                if (code === 500) stderr(ret);
                request.socket.unref();
            });
            return;
        }

        if ( // Response.redirect patch
            ret.headers['x-servicestation-response-redirect-url']
            && !(ret.status < 300 || ret.status > 399)
        ) {
            response.writeHead(ret.status, {
                Location: ret.headers['x-servicestation-response-redirect-url'],
            }).end(() => {
                log(request, ret.status);
                request.socket.unref();
            });
            return;
        }

        const data = new Uint8Array(ret.body);

        const { 'content-encoding': _, ...headers } = ret.headers;

        // mutually exclusive headers
        if (!('transfer-encoding' in headers)) {
            headers['content-length'] = headers['content-length'] ?? data.byteLength;
        }

        response.writeHead(ret.status, headers).end(data, () => {
            log(request, ret.status);
            request.socket.unref();
        });
    };
};
