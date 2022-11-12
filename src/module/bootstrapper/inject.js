module.exports = {
    activate: (() => { /* servicestation::activate */
        self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()), { once: true });
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
    /* eslint-disable no-new */
    override: (() => { /* servicestation::override */
        Object.defineProperty(Response, 'redirect', {
            enumerable: true,
            configurable: false,
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
            writable: true,
        });
    }).toString(),
    /* eslint-enable no-new */
};
