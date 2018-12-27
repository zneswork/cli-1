const Command = require('../../Command');

const docker = new Command({
    root: true,
    command: 'docker',
    description: 'Docker commands',
    usage: 'codefresh docker --help',
    // betaCommand: true, // todo: uncomment
    webDocs: {
        title: 'Docker',
        weight: 70,
    },
    builder: (yargs) => {
        return yargs
            .demandCommand(1, 'You need at least one command before moving on');
    },
});

module.exports = docker;
