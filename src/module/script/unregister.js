module.exports = () => new Promise((resolve, reject) => {
    let timeout = setTimeout(() => {
        timeout = undefined;
        reject(new Error('Service worker deregistration timed out.'));
    }, 10000);

    navigator.serviceWorker.getRegistrations().then((registrations) => {
        Promise.all(registrations.map((r) => r.unregister())).then(resolve);
    }).catch((err) => {
        reject(err);
    }).finally(() => clearTimeout(timeout));
});
