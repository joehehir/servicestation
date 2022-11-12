const wait = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

const handler = async (event) => {
    const { pathname } = new URL(event.request.url);

    // ignore favicon requests
    if (pathname.endsWith('/favicon.ico')) {
        return new Response(null, { status: 204 });
    }

    // https://servicestation.test/r/github
    if (/\/r\/github\/?/.test(pathname)) {
        return Response.redirect('https://github.com', 302);
    }

    // https://servicestation.test/github
    if (/\/github\/?/.test(pathname)) {
        return fetch('https://github.com/');
    }

    // https://servicestation.test/joehehir.com_og-image
    if (/\/joehehir\.com_og-image\/?/.test(pathname)) {
        return fetch('https://raw.githubusercontent.com/joehehir/depository/master/img/joehehir.com/og-image_1.91-1.webp');
    }

    // https://servicestation.test/jquery-3.6.1
    if (/\/jquery-3\.6\.1\/?/.test(pathname)) {
        return fetch('https://github.com/jquery/jquery/archive/refs/tags/3.6.1.zip');
    }

    // https://servicestation.test/stream
    if (/\/stream\/?/.test(pathname)) {
        // ref: https://web.dev/fetch-upload-streaming/
        const stream = new ReadableStream({
            async start(controller) {
                await wait(500);
                controller.enqueue('This ');
                await wait(500);
                controller.enqueue('ReadableStream ');
                await wait(500);
                controller.enqueue('was ');
                await wait(500);
                controller.enqueue('buffered.');
                controller.close();
            },
        /* eslint-disable-next-line no-undef */
        }).pipeThrough(new TextEncoderStream());

        return new Response(stream, {
            status: 200,
            headers: {
                'content-type': 'text/plain',
                'transfer-encoding': 'chunked',
            },
        });
    }

    // https://servicestation.test/timeout-3000
    if (/\/timeout-3000\/?/.test(pathname)) {
        await wait(3000);
    }

    // curl -X POST -d '{"method":"POST","response":"/: Hello, World!"}' https://servicestation.test
    if (event.request.method === 'POST') {
        const body = await event.request.json()
            .then((res) => res)
            .catch((err) => err);
        const stringified = !(body instanceof Error)
            ? `${JSON.stringify(body)}\n`
            : '{}\n';

        return new Response(stringified, {
            status: 200,
            headers: {
                'content-type': 'application/json',
            },
        });
    }

    // https://servicestation.test
    return new Response('/: Hello, World!', {
        status: 200,
        headers: {
            'content-type': 'text/plain',
        },
    });
};

self.addEventListener('fetch', (event) => {
    event.respondWith(handler(event));
});
