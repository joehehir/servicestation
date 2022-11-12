module.exports = (request) => new Promise((resolve, reject) => {
    const buffered = [];

    const remove = (ref) => Object.entries(ref).forEach((e) => request.removeListener(...e));
    const events = {
        end: () => {
            remove(events);
            resolve(Buffer.concat(buffered));
        },
        error: (err) => {
            remove(events);
            reject(err);
        },
        // no size restriction imposed
        data: (chunk) => buffered.push(chunk),
    };

    Object.entries(events).forEach((e) => request.on(...e));
});
