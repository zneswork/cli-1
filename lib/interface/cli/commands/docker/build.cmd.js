const Command = require('../../Command');
const dockerCmd = require('../root/docker.cmd');
const { workflow, pipeline, log } = require('../../../../logic').api;
const CFError = require('cf-errors');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const recursive = require('recursive-readdir');

const { Storage } = require('@google-cloud/storage');

const CF_SYSTEM_DOCKER_BUILD_PIP = 'cf_system_docker_build';
const COMMAND = 'docker build';

const projectId = 'savvy-badge-103912';
const bucketName = 'cf-docker-build';

// const optionList = [
//     'add-host',
//     'build-arg',
//     'cache-from',
//     'cgroup-parent',
//     'compress',
//     'cpu-period',
//     'cpu-quota',
//     'cpu-shares',
//     'cpuset-cpus',
//     'cpuset-mems',
//     'disable-content-trust',
//     'file',
//     'force-rm',
//     'iidfile',
//     'isolation',
//     'label',
//     'memory',
//     'memory-swap',
//     'network',
//     'no-cache',
//     'platform',
//     'progress',
// ]; // todo: maybe parse

/**
 * !!! CURRENTLY NOT WORKING WITHOUT !!!:
 *
 *  export GOOGLE_APPLICATION_CREDENTIALS=[path_to_gcs_credentials].json
 * */
const add = new Command({
    command: 'build [path]',
    description: 'Docker build',
    usage: 'codefresh docker build --help',
    parent: dockerCmd,
    // betaCommand: true, // todo: uncomment
    webDocs: {
        category: 'Docker',
        title: 'Docker build',
        weight: 70,
    },
    builder: (yargs) => {
        return yargs
            .positional('path', {
                describe: 'path to sources',
            });
    },
    handler: async (argv) => {
        if (!argv.path) {
            console.log('Path to sources must be provided');
            return;
        }

        const pathToSources = path.resolve(process.cwd(), argv.path);
        if (!fs.existsSync(pathToSources)) {
            console.log(`Path to sources does not exist: ${pathToSources}`);
            return;
        }
        if (!fs.lstatSync(pathToSources).isDirectory()) {
            console.log(`Path to sources is not a directory: ${pathToSources}`);
            return;
        }

        const storage = new Storage({ projectId });
        const bucket = storage.bucket(bucketName);

        const paths = await recursive(pathToSources);
        const tempFolderPrefix = `build-${Date.now()}`;

        const files = paths.map(p => {
            const storagePath = p.replace(pathToSources, '');
            return { localPath: p, storagePath: `${tempFolderPrefix}${storagePath}` };
        });

        // upload files
        const promises = files.map((f) => {
            return bucket.upload(f.localPath, { destination: f.storagePath })
                .then(() => console.log(`Uploaded: ${f.localPath}`));
        });
        await Promise.all(promises);

        const options = { variables: { GOOGLE_BUILD_FOLDER: tempFolderPrefix, CF_DOCKER_CONTEXT: '.' } };

        // proxy docker build params
        const argStr = process.argv.slice(0, -1).join(' ');
        if (!argStr.endsWith(COMMAND)) {
            const splitted = argStr.split(COMMAND);
            if (splitted.length === 2) {
                const buildArgs = splitted[1];
                console.log(`Docker args detected: ${buildArgs}`);
                options.variables.CF_DOCKER_CONTEXT = `${buildArgs} .`;
            }
        }

        try {
            await pipeline.getPipelineByName(CF_SYSTEM_DOCKER_BUILD_PIP);
        } catch (err) {
            throw new CFError({
                message: `Passed pipeline id: ${CF_SYSTEM_DOCKER_BUILD_PIP} does not exist`,
            });
        }

        const workflowId = await pipeline.runPipelineByName(CF_SYSTEM_DOCKER_BUILD_PIP, options);

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
    },
});

module.exports = add;
