self.addEventListener('fetch', (event) => {
    event.respondWith(new Response('/a/: Hello, World!', {
        status: 200,
        headers: {
            'content-type': 'text/plain',
        },
    }));
});
