module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es6: true,
        node: true
    },
    parser: 'babel-eslint',
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaFeatures: {
            experimentalObjectRestSpread: true,
            jsx: true
        },
        sourceType: 'module'
    },
    plugins: ['react'],
    rules: {
        indent: ['error', 4, {
            SwitchCase: 1
        }],
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single'],
        'react/jsx-uses-react': 'error',
        'react/jsx-uses-vars': 'error',
        semi: ['error', 'always']
    }
};