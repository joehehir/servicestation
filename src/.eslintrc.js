module.exports = {
    env: {
        browser: true,
        node: true,
    },
    extends: ['airbnb-base'],
    parserOptions: {
        ecmaVersion: 2020,
    },
    rules: {
        'arrow-body-style': 0,
        indent: ['error', 4],
        'no-await-in-loop': 0,
        'no-console': 0,
        'no-restricted-globals': 0,
        'no-restricted-syntax': 0,
    },
    overrides: [
        {
            files: ['**/*.test.js'],
            globals: {
                describe: 'readonly',
                it: 'readonly',
            },
        },
    ],
};
