module.exports = {
    activate: (() => { /* servicestation::activate */
        self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()), { once: true });
        self.addEventListener('install', self.skipWaiting, { once: true });
    }).toString(),
    internal: (() => { /* servicestation::internal */
        self.addEventListener('fetch', (e) => e.respondWith(
            e.request.url.endsWith('/')
                ? new Response('<!DOCTYPE html><title>index</title>', {
                    headers: { 'content-type': 'text/html' },
                    status: 200,
                })
                : new Response(null, { status: 204 }),
        ));
    }).toString(),
    /* eslint-disable no-global-assign, no-new, no-param-reassign */
    override: (() => { /* servicestation::override */
        /* response-redirect */
        Object.defineProperty(Response, 'redirect', {
            enumerable: true,
            configurable: false,
            writable: true,
            value: (url, status = 302) => {
                new URL(url);
                if (status < 300 || status > 399) {
                    throw new RangeError('Failed to execute \'redirect\' on \'Response\': Invalid status code.');
                }
                return new Response(null, {
                    headers: {
                        'x-servicestation-response-redirect-url': url,
                    },
                    status,
                });
            },
        });
        /* response-headers-set-cookie */
        const FetchResponse = Response;
        class ServiceStationResponse extends FetchResponse {
            constructor(body, options) {
                const headers = new Headers(options?.headers);
                const cookies = headers.get('set-cookie');
                if (cookies) {
                    headers.set('x-servicestation-response-headers-set-cookie', cookies);
                    options.headers = headers;
                }
                super(body, options);
            }
        }
        Response = ServiceStationResponse;
    }).toString(),
    /* eslint-enable no-global-assign, no-new, no-param-reassign */
};
