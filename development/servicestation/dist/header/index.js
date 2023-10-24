const throwable = (fn, ...args) => {
    try {
        return fn(...args);
    } catch (e) {
        return new Error(e);
    }
};

// curl -H "Set-Cookie: zero=0;one=1" -H "Set-Cookie: two=2" https://servicestation.test/header/
const handler = async (event) => {
    const { pathname } = new URL(event.request.url);

    // https://servicestation.test/header/<name>
    const match = pathname.match(/\/header\/([\w-]+)\/?/);
    if (match?.[1]) {
        const name = match[1];

        const specific = throwable(() => event.request.headers.get(name));
        if (specific === null || specific instanceof Error) {
            const msg = (specific instanceof Error)
                ? specific.message
                : null;

            // error or not present
            return new Response(`header: ${JSON.stringify(msg, null, 2)}`, {
                status: 200,
                headers: {
                    'content-type': 'text/plain',
                },
            });
        }

        return new Response(`header: ${JSON.stringify({ [name]: specific }, null, 2)}`, {
            status: 200,
            headers: {
                'content-type': 'text/plain',
            },
        });
    }

    // https://servicestation.test/header/
    const all = Object.fromEntries(event.request.headers.entries());

    const headers = { 'content-type': 'text/plain' };

    if (all['x-set-cookie']) {
        headers['set-cookie'] = all['x-set-cookie'];
    }

    return new Response(`/header/: ${JSON.stringify(all, null, 2)}`, {
        status: 200,
        headers,
    });
};

self.addEventListener('fetch', (event) => {
    event.respondWith(handler(event));
});
