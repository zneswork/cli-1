const Command = require('../../../Command');
const {
    installChart,
} = require('./../../../../../logic/api/helm');
const { printError } = require('./../../../helpers/general');
const { log, workflow } = require('../../../../../logic').api;
const createRoot = require('../../root/create.cmd');
const _ = require('lodash');

const install = new Command({
    parent: createRoot,
    command: 'environment',
    aliases: ['env'],
    description: 'Install or upgrade a Helm chart Repository flag can be either absolute url or saved repository in Codefresh',
    webDocs: {
        category: 'Predefined Pipelines',
        title: 'Install or Upgrade Helm Chart (Create Environment)',
        weight: 20,
    },
    builder: (yargs) => {
        return yargs
            .option('cluster', {
                description: 'Install on cluster [required]',
                type: 'string',
            })
            .option('namespace', {
                description: 'Install on namespace',
                default: 'default',
                type: 'string',
            })
            .option('tiller-namespace', {
                description: 'Where tiller has been installed',
                default: 'kube-system',
                type: 'string',
            })
            .option('repository', {
                description: 'Helm repository (absolute url or name of context with type help-repository) [required]',
                type: 'string',
                default: 'https://kubernetes-charts.storage.googleapis.com',
            })
            .option('name', {
                description: 'Name of the chart in the repository [required]',
                type: 'string',
            })
            .option('version', {
                description: 'Version of the chart in the repository [required]',
                type: 'string',
            })
            .option('context', {
                description: 'Contexts (yaml || secret-yaml) to be passed to the install',
                array: true,
            })
            .option('set', {
                description: 'set of KEY=VALUE to be passed to the install',
                array: true,
            })
            .option('detach', {
                alias: 'd',
                describe: 'Run pipeline and print build ID',
            })
            .option('release-name', {
                description: 'The name to set to the release',
            })
            .example('codefresh create env --repository https://kubernetes-charts.storage.googleapis.com', 'Install chart from public helm repo')
            .example('codefresh get ctx --type helm-repository', 'Get all helm repos')
            .example('codefresh create env --repository my-help-repository', 'Install chart saved repo' );
    },
    handler: async (argv) => {
        try {
            const requiredKeys = ['cluster', 'name', 'version'];
            const arrayKeys = ['context', 'set'];
            const keys = ['releaseName', 'cluster', 'namespace', 'name', 'repository', 'version', 'context', 'tillerNamespace', 'set'];

            const options = argv.filename; // coerced to object
            arrayKeys.forEach((key) => {
                const value = options[key];
                if (value && !_.isArray(value)) {
                    throw new Error(`Wrong options file -- "${key}" must be an array`);
                }
            });

            const fullOptions = _.merge(_.pick(argv, keys), _.pick(options, keys));
            requiredKeys.forEach((key) => {
                if (!fullOptions[key]) {
                    throw new Error(`"--${key}" must be provided either in file or as option`);
                }
            });

            fullOptions.setValues = fullOptions.set;
            delete fullOptions.set;
            fullOptions.values = fullOptions.context;
            delete fullOptions.context;

            const workflowId = await installChart(fullOptions);
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
        } catch (err) {
            printError(err);
            process.exit(1);
        }
    },
});

module.exports = install;
