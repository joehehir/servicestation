const handler = async (event) => {
    const { pathname } = new URL(event.request.url);

    // https://servicestation.test/storage/github
    if (/\/storage\/github\/?/.test(pathname)) {
        const cache = await caches.open('dev');
        const key = new Request('https://github.com');

        const fromCache = await cache.match(key);
        if (fromCache) {
            console.info('x-cache-api: HIT');
            return fromCache;
        }

        console.info('x-cache-api: MISS');
        return fetch(key).then((response) => {
            const ret = response.clone();

            const headers = new Headers(response.headers);
            headers.append('x-cache-api', 'HIT');

            event.waitUntil(cache.put(key, new Response(response.body, {
                status: response.status,
                headers,
            })));

            return ret;
        });
    }

    // https://servicestation.test/storage/
    return new Response('/storage/: Hello, World!', {
        status: 200,
        headers: {
            'content-type': 'text/plain',
        },
    });
};

self.addEventListener('fetch', (event) => {
    event.respondWith(handler(event));
});
