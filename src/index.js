const { exec } = require('child_process');
const { createServer } = require('http');
const process = require('process');
const puppeteer = require('puppeteer-core');
const bootstrapper = require('./module/bootstrapper');
const activate = require('./module/script/activate');
const unregister = require('./module/script/unregister');
const handler = require('./module/handler');
const sigtrap = require('./module/sigtrap');
const switches = require('./module/switches');
const {
    stderr,
    stdout,
    throwable,
    to,
} = require('./module/util');

(async () => {
    let err;

    // util.sh::scopes_json
    if (process.argv[2] === '') {
        stderr(new RangeError('Invalid value for \'scopes\'. At least 1 service worker is required.'));
        process.kill(1);
        return;
    }

    const scopes = throwable(JSON.parse, process.argv[2]);
    if (scopes instanceof Error) {
        stderr(scopes);
        process.kill(1);
        return;
    }

    // util.sh::user_agent_string
    const ua = process.argv[3];
    const argv = process.argv.slice(4);

    const [error, origin] = await to(bootstrapper());
    if (error) {
        stderr(error);
        process.kill(1);
        return;
    }

    if (JSON.stringify(scopes).includes(`"${origin.internal}"`)) {
        stderr(new URIError(`'${origin.internal}' is a reserved scope.`));
        process.kill(1);
        return;
    }

    // ref: https://peter.sh/experiments/chromium-command-line-switches/
    const args = switches(
        [
            '--disable-background-networking',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--enable-features=NetworkService',
            '--headless',
            '--no-pings',
            '--remote-debugging-port=9222',
            `--unsafely-treat-insecure-origin-as-secure=${origin.host}`,
            `--user-agent=${ua}`,
        ],
        argv,
        [ // merge comma separated switches
            '--enable-features',
            '--unsafely-treat-insecure-origin-as-secure',
        ],
    );

    const browser = await Promise.race([
        puppeteer.launch({
            args,
            executablePath: '/usr/bin/chromium-browser',
            handleSIGINT: false,
            handleSIGTERM: false,
            handleSIGHUP: false,
        }),
        new Promise((r) => {
            setTimeout(() => r(new Error('Browser launch timeout exceeded.')), 10000);
        }),
    ]);
    if (browser instanceof Error) {
        stderr(browser);
        process.kill(1);
        return;
    }

    // unregister service workers
    const [startpage] = await browser.pages();
    [err] = await to(startpage.goto(`${origin.host}${origin.internal}`).then(() => {
        return startpage.evaluate(unregister);
    }));
    if (!err) { // activate internal use reserved scope service worker
        [err] = await to(startpage.goto(`${origin.host}${origin.internal}`).then(() => {
            return startpage.evaluate(activate, origin.host, origin.internal);
        }));
    }
    if (err) {
        stderr(err);
        process.kill(1);
        return;
    }
    await startpage.close();

    const mapping = new Map();
    for (const scope of scopes) {
        const page = await browser.newPage();
        mapping.set(scope, page);
    }

    // requires ordered activation
    for (const [scope, page] of mapping) {
        [err] = await to(page.goto(`${origin.host}${scope}`).then(() => {
            return page.evaluate(activate, origin.host, scope);
        }));
        if (err) {
            stderr(err);
            process.kill(1);
            return;
        }
    }

    // parse request timeout for patch
    const timeout = (() => {
        const match = JSON.stringify(argv).match(/--timeout=([\d]+)/);
        return match?.[1]
            || 60000;
    })();

    const server = createServer(handler(origin.host, scopes, mapping, timeout));

    server.on('connection', (socket) => socket.unref());
    server.on('clientError', (e, socket) => ((e.code !== 'ECONNRESET' && socket.writable) && socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')));
    server.on('dropRequest', () => stderr(new Error('Request dropped. \'server.maxRequestsPerSocket\' threshold exceeded.')));

    const chromium = browser.process().pid;

    const shutdown = () => {
        if (server.listening) {
            stderr(new Error('Unexpected browser disconnect.'));
        }

        exec(
            `/bin/sh /usr/src/app/killchromium.sh ${chromium}`,
            { timeout: 10000 },
            (_, code) => process.exit(code ?? 1),
        );
    };
    browser.once('disconnected', shutdown);

    sigtrap(() => server.close(() => browser.disconnect()));

    server.listen(process.env.PORT, '0.0.0.0', () => {
        origin.server.close();

        if (process.env.NODE_ENV === 'development' && process.env.LIVERELOAD_FIFO) {
            exec(
                `printf "%s\n" "restart_pending=1" > "${process.env.LIVERELOAD_FIFO}"`,
                { timeout: 1000 },
            );
        }

        stdout('port:', `${process.env.PORT},`, 'scopes:', process.argv[2]);
    });
})();
