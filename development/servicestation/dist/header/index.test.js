const { exec } = require('child_process');

module.exports = ({ expect, host }) => {
    describe('[scope]: "/header/"', () => {
        it('"/header/" response body should contain renamed "x-set-cookie" header"', (done) => {
            const req = new Promise((resolve, reject) => {
                const curl = `curl --silent --show-error -H "Set-Cookie: zero=0;one=1" ${host}/header/`;

                exec(curl, (stderr, stdout, error) => {
                    if (stderr instanceof Error) return reject(stderr);
                    if (error) return reject(error);

                    return resolve({ text: stdout });
                });
            });

            req
                .then((res) => {
                    expect(res.text).to.match(/"x-set-cookie": "zero=0;one=1"/);
                    done();
                })
                .catch((err) => done(err));
        });

        it('"/header/" response body should contain merged "x-set-cookie" headers"', (done) => {
            const req = new Promise((resolve, reject) => {
                const curl = `curl --silent --show-error -H "Set-Cookie: zero=0;one=1" -H "Set-Cookie: two=2" ${host}/header/`;

                exec(curl, (stderr, stdout, error) => {
                    if (stderr instanceof Error) return reject(stderr);
                    if (error) return reject(error);

                    return resolve({ text: stdout });
                });
            });

            req
                .then((res) => {
                    expect(res.text).to.match(/"x-set-cookie": "zero=0;one=1;two=2;?"/);
                    done();
                })
                .catch((err) => done(err));
        });

        it('"/header/" response headers should contain "set-cookie" headers', (done) => {
            const req = new Promise((resolve, reject) => {
                const curl = `curl --silent --show-error -H "Set-Cookie: zero=0;one=1" -H "Set-Cookie: two=2" -I ${host}/header/`;

                exec(curl, (stderr, stdout, error) => {
                    if (stderr instanceof Error) return reject(stderr);
                    if (error) return reject(error);

                    return resolve({ headersStringified: stdout });
                });
            });

            req
                .then((res) => {
                    expect(res.headersStringified).to.match(/set-cookie: zero=0;one=1;two=2;?/);
                    done();
                })
                .catch((err) => done(err));
        });
    });
};
