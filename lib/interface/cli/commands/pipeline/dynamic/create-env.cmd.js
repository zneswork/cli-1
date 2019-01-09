const Command = require('../../../Command');
const { log, workflow, pipeline } = require('../../../../../logic').api;
const createRoot = require('../../root/create.cmd');
const _ = require('lodash');
const CFError = require('cf-errors'); // eslint-disable-line

const AMDOCS_PIPELINE = 'codefresh-io/amdocs/amdocs-create-env';


const cmd = new Command({
    parent: createRoot,
    command: 'environment',
    aliases: ['env'],
    description: 'Create amdocs env',
    webDocs: {
        category: 'Predefined Pipelines',
        title: 'Create amdocs env',
        weight: 20,
    },
    builder: (yargs) => {
        return yargs
            .option('cluster', {
                alias: 'c',
                description: 'cluster',
                type: 'string',
            })
            .option('drop', {
                description: 'drop',
            })
            .option('env', {
                alias: 'e',
                description: 'env',
            })
            .option('detach', {
                alias: 'd',
                describe: 'Run pipeline and print build ID',
            });
    },
    handler: async (argv) => {
        const keys = ['cluster', 'drop', 'env'];

        const options = argv.filename; // coerced to object

        const fullOptions = _.merge(_.pick(options, keys), _.pick(argv, keys));
        const data = {
            branch: fullOptions.drop,
        };
        delete fullOptions.drop;
        data.variables = _.keys(fullOptions).reduce((obj, key) => {
            obj[key.toUpperCase()] = fullOptions[key];
            return obj;
        }, {});

        try {
            await pipeline.getPipelineByName(AMDOCS_PIPELINE);
        } catch (err) {
            throw new CFError({
                message: `Pipeline does not exist: ${AMDOCS_PIPELINE}`,
            });
        }


        const workflowId = await pipeline.runPipelineByName(AMDOCS_PIPELINE, data);
        if (argv.detach) {
            console.log(workflowId);
        } else {
            await log.showWorkflowLogs(workflowId, true);
            const workflowInstance = await workflow.getWorkflowById(workflowId);
            switch (workflowInstance.getStatus()) {
                case 'success':
                    process.exit(0);
                    break;
                case 'error':
                    process.exit(1);
                    break;
                case 'terminated':
                    process.exit(2);
                    break;
                default:
                    process.exit(100);
                    break;
            }
        }
    },
});

module.exports = cmd;
