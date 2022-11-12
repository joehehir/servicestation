const { exec } = require('child_process');

module.exports = (path) => new Promise((resolve, reject) => {
    exec(
        `[ -r "${path}" ] && cat "${path}" || >&2 printf -- 1`,
        { maxBuffer: (1024 * 1024 * 10) },
        (err, stdout, stderr) => {
            if (err) return reject(err);
            if (stderr === '1') return reject(new Error(`Error reading file '${path}'.`));

            return resolve(stdout);
        },
    );
});
