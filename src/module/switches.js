module.exports = (servicestation, argv, csv) => {
    // prioritize user provided arguments
    const unique = Array.from(new Set([
        ...servicestation,
        ...argv,
    ]));

    // merge comma separated
    const indices = [];
    const merged = csv.reduce((arr, k) => {
        const params = unique.reduce((str, v, i) => {
            const match = (v.split(`${k}=`)[1]);
            if (match) {
                indices.push(i);
                return `${str}${match},`;
            }
            return str;
        }, '').replace(/,$/, '');

        if (params) {
            arr.push(`${k}=${params}`);
        }
        return arr;
    }, []);

    // remove unsupported or patched switches by prefix
    const exclude = new RegExp(`^${[
        '--timeout=',
    ].join('|^')}`);

    const occurred = new Set();
    const filtered = unique.reduceRight((arr, entry, i) => {
        if (exclude.test(entry)) return arr;

        const key = entry.split('=')[0];

        // first occurrence of key and not merged above
        if (!occurred.has(key) && !indices.includes(i)) {
            occurred.add(key);
            return arr.concat(entry);
        }
        return arr;
    }, []);

    return [
        ...merged,
        ...filtered,
    ];
};
