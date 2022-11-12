module.exports = ({ chai, expect, host }) => {
    describe('[scope]: "/storage/"', () => {
        it('"/storage/github" should return "https://github.com"', (done) => {
            chai
                .request(host)
                .get('/storage/github')
                .end((err, res) => {
                    if (err) done(err);

                    expect(res).to.have.status(200);
                    expect(res).to.have.header('content-type', /^text\/html/);
                    done();
                });
        });

        it('"/storage/github" should return "https://github.com" (cached)', (done) => {
            chai
                .request(host)
                .get('/storage/github')
                .end((err, res) => {
                    if (err) done(err);

                    expect(res).to.have.status(200);
                    expect(res).to.have.header('content-type', /^text\/html/);
                    expect(res).to.have.header('x-cache-api', 'HIT');
                    done();
                });
        });
    });
};
