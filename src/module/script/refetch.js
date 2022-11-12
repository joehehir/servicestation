module.exports = (resource, init) => {
    if (Array.isArray(init.body)) {
        /* eslint-disable-next-line no-param-reassign */
        init.body = new Uint8Array(init.body);
    }

    return fetch(resource, init).then(async (res) => {
        const ab = await res.arrayBuffer();
        return {
            body: Array.from(new Uint8Array(ab)),
            headers: Object.fromEntries(res.headers.entries()),
            status: res.status,
        };
    });
};
