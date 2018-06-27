const debug = require('debug')('codefresh:cli:create:context');
const Command = require('../../Command');
const CFError = require('cf-errors');
const _ = require('lodash');
const { repository } = require('../../../../logic').api;
const createRoot = require('../root/create.cmd');
const yargs = require('yargs');

const command = new Command({
    command: 'repository',
    aliases: ['repo'],
    parent: createRoot,
    description: 'Add a repository',
    webDocs: {
        category: 'Repository',
        title: 'Create Repository',
    },
    builder: (yargs) => {
        yargs
            .option('repo-owner', {
                describe: 'Owner of the git repository',
                alias: 'ro',
                required: true,
            })
            .option('repo-name', {
                describe: 'Name of the repository',
                alias: 'rn',
                required: true,
            })
            .option('context-name', {
                describe: 'Name of the context to use, if not passed the default of will be used',
                alias: 'cn',
            })
            .option('context-owner', {
                describe: 'Owner of the context, user owned contexts cannot be accessible by other users across the account',
                choices: ['account', 'user'],
                alias: 'co',
                default: 'account',
            })
            .option('context-type', {
                describe: 'Owner of the context, user owned contexts cannot be accessible by other users across the account',
                choices: ['git.github', 'git.gitlab', 'git.bitbucket', 'git.stash'],
                alias: 'ct',
            });
        return yargs;
    },
    handler: async (argv) => {
        const context = {
            owner: argv['context-owner'],
            type: argv['context-type'],
            name: argv['context-name'],
        };
        await repository.createRepository(argv['repo-owner'], argv['repo-name'], context);
    },
});

module.exports = command;

