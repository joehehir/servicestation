const { createServer } = require('http');
const resource = require('./resource');
const { stderr, to } = require('../util');

module.exports = () => new Promise((resolve) => {
    const hostname = '127.0.0.1';
    const port = 3000;
    const internal = '/.servicestation/';

    const server = createServer(async (request, response) => {
        request.socket.ref();

        const [err, asset] = await to(resource(internal, request.url));
        if (err) {
            response.writeHead(500).end(() => {
                stderr(err);
                request.socket.unref();
            });
            return;
        }

        if (asset === undefined) {
            response.writeHead(204).end(() => {
                request.socket.unref();
            });
            return;
        }

        response.writeHead(200, {
            ...asset.headers,
        }).end(asset.src, () => {
            request.socket.unref();
        });
    });

    server.on('connection', (socket) => socket.unref());

    server.listen(port, hostname, () => {
        resolve({
            host: `http://${hostname}:${port}`,
            internal,
            server,
        });
    });
});
