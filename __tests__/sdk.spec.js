const _ = require('lodash');
const path = require('path');
const CFError = require('cf-errors');
const columnify = require('columnify');
const { Analyzer, Validator } = require('codefresh-sdk').utils;

const root = path.resolve(__dirname, '../');
const specPath = path.resolve(root, './openapi.json');
const filters = ['node_modules', 'docs', 'brew', 'coverage', 'temp', 'dist'];

describe('sdk usage validator', async () => {
    jest.setTimeout(10000);
    it('should asdf', async () => {
        const usages = await Analyzer.analyzeDir(root, filters);
        const errors = await Validator.validate(usages, specPath);
        if (!_.isEmpty(errors)) {
            const errorsTable = columnify(errors, { columnSplitter: '  ' });
            throw new CFError(errorsTable);
        }
    });
});
