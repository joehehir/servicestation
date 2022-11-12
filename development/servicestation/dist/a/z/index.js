self.addEventListener('fetch', (event) => {
    event.respondWith(new Response('/a/z/: Hello, World!', {
        status: 200,
        headers: {
            'content-type': 'text/plain',
        },
    }));
});
