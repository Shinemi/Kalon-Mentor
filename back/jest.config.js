module.exports = {
    testEnvironment: 'node',

    collectCoverageFrom: [
        '**/*.js',
        '!tests/**',
        '!coverage/**',
        '!node_modules/**'
    ],

    coverageDirectory: 'coverage',

    coverageReporters: [
        'text',
        'html',
        'lcovonly'
    ]
}