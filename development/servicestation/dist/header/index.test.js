const { exec } = require('child_process');

module.exports = ({ expect, host }) => {
    describe('[scope]: "/header/"', () => {
        it('"/header/" should return merged "set-cookie" headers"', (done) => {
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
                    expect(res.text).to.match(/"set-cookie": "zero=0;one=1;two=2;?"/);
                    done();
                })
                .catch((err) => done(err));
        });
    });
};
