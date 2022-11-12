const process = require('process');
const util = require('util');

const is = (primitive) => (primitive && !/^0|FALSE$/i.test(primitive));

const stderr = (...args) => process.stderr.write(`[${new Date().toISOString()}] ${util.format(...args)}\n`);

const stdout = (...args) => process.stdout.write(`[${new Date().toISOString()}] ${util.format(...args)}\n`);

const throwable = (fn, ...args) => {
    try {
        return fn(...args);
    } catch (err) {
        return err;
    }
};

const to = (promise) => promise.then((res) => [undefined, res]).catch((err) => [err]);

module.exports = {
    is,
    stderr,
    stdout,
    throwable,
    to,
};
