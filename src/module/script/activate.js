module.exports = (host, scope) => new Promise((resolve, reject) => {
    let timeout = setTimeout(() => {
        timeout = undefined;
        reject(new Error(`Service worker activation timed out for scope '${scope}'.`));
    }, 10000);

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        clearTimeout(timeout);
        resolve();
    }, { once: true });

    navigator.serviceWorker.register(`${host}${scope}index.js`, { scope }).catch((err) => {
        clearTimeout(timeout);
        reject(err);
    });
});
