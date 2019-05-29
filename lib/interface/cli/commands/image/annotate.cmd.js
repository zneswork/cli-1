const Command = require('../../Command');
const annotateRoot = require('../root/annotate.cmd');
const annotationLogic = require('../annotation/annotation.logic');

const command = new Command({
    command: 'image <id>',
    aliases: ['img'],
    parent: annotateRoot,
    description: 'Annotate an image',
    usage: 'Annotating an image gives the ability to add extra context on your already existing images',
    webDocs: {
        category: 'Images',
        title: 'Annotate Image',
    },
    builder: (yargs) => {
        return yargs
            .positional('id', {
                describe: 'Docker image full name or id',
            })
            .option('labels', {
                describe: 'annotations to add to the image',
                default: [],
                alias: 'l',
            })
            .example('codefresh annotate image 2dfacdaad466 -l coverage=75%', 'Annotate an image with a single label')
            .example('codefresh annotate image 2dfacdaad466 -l coverage=75% -l tests_passed=true', 'Annotate an image with multiple labels');
    },
    handler: async (argv) => {
        const { id: entityId, labels } = argv;
        const annotationsResponse = await annotationLogic.createAnnotations({ entityId, entityType: 'image', labels });
        console.log(`Annotations added successfully\n${JSON.stringify(annotationsResponse)}`);
        return annotationsResponse;
    },
});

module.exports = command;

