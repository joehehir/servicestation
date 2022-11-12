const process = require('process');
const { stderr } = require('./util');

module.exports = (close) => {
    process.once('uncaughtException', (error) => {
        stderr(error);
        close();
    });
    process.once('SIGINT', close);
    process.once('SIGTERM', close);
    process.once('SIGHUP', close);
};
