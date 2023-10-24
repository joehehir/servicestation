const chai = require('../../../src/node_modules/chai');
const http = require('../../../src/node_modules/chai-http');
const header = require('./header/index.test');
const storage = require('./storage/index.test');

chai.use(http);

const refs = {
    chai,
    expect: chai.expect,
    host: 'https://servicestation.test',
};

header(refs);
storage(refs);

(({ expect, host }) => {
    describe('[scope]: "/"', () => {
        it('"/r/github" should redirect to "https://github.com"', (done) => {
            chai
                .request(host)
                .get('/r/github')
                .end((err, res) => {
                    if (err) done(err);

                    expect(res).to.redirectTo(/https:\/\/github\.com\/?/);
                    expect(res).to.have.status(200);
                    done();
                });
        });

        it('"/github" should return "https://github.com"', (done) => {
            chai
                .request(host)
                .get('/github')
                .end((err, res) => {
                    if (err) done(err);

                    expect(res).to.have.status(200);
                    expect(res).to.have.header('content-type', /^text\/html/);
                    expect(res.text).to.include('property="og:site_name" content="GitHub"');
                    done();
                });
        });

        it('"/joehehir.com_og-image" should return an image', (done) => {
            chai
                .request(host)
                .get('/joehehir.com_og-image')
                .end((err, res) => {
                    if (err) done(err);

                    expect(res).to.have.status(200);
                    expect(res).to.have.header('content-type', 'image/webp');
                    done();
                });
        });

        it('"/stream" should return a buffered response stream', (done) => {
            chai
                .request(host)
                .get('/stream')
                .end((err, res) => {
                    if (err) done(err);

                    expect(res).to.have.status(200);
                    expect(res.text).to.include('This ReadableStream was buffered.');
                    done();
                });
        });

        it('"/" should return POST request JSON', (done) => {
            const json = {
                method: 'POST',
                response: '/: Hello, World!',
            };

            chai
                .request(host)
                .post('/')
                .set('content-type', 'application/json')
                .send(json)
                .end((err, res) => {
                    if (err) done(err);

                    expect(res).to.have.status(200);
                    expect(res).to.have.header('content-type', 'application/json');
                    expect(res.text).to.equal(`${JSON.stringify(json)}\n`);
                    done();
                });
        });
    });
})(refs);
