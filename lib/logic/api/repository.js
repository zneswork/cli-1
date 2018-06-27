const CFError = require('cf-errors'); // eslint-disable-line
const {
    sendHttpRequest
} = require('./helper');
const {
    createPipeline
} = require('./pipeline');

async function _createFirstPipelineFromCreatedRepo(repoOwner, repoName, context, pipelineName) {
    const fullName = `${repoOwner}/${repoName}`;
    const trigger = {
        type: 'git',
        repo: fullName,
        events: ['push'],
        branchRegex: '/.*/gi',
    };
    if (context) {
        trigger.context = context;
    } else {
        trigger.provider = 'github';
    }
    const pipeline = {
        metadata: {
            name: `${pipelineName}/${repoName}`,
            labels: {
                tags: [],
            },
            deprecate: {
                repoPipeline: true,
                basic: true,
                template: 'Ubuntu',
            },
        },
        spec: {
            triggers: [trigger],
            contexts: [],
            variables: [],
            steps: {
                BuildingDockerImage: {
                    title: 'Building Docker Image',
                    type: 'build',
                    image_name: `${fullName}`,
                    working_directory: './',
                    tag: '${{CF_BRANCH_TAG_NORMALIZED}}',
                    dockerfile: {
                        content: 'FROM alpine',
                    },
                },
            },
        },
    };
    createPipeline(pipeline);
}

const createRepository = async (repoOwner, repoName, context) => {
    const fullName = `${repoOwner}/${repoName}`;
    const qs = {};
    if (context) {
        qs['context-owner'] = context.owner;
        qs['context-type'] = context.type;
        qs['context-name'] = context.name;
    }
    const userOptions = {
        url: `/api/services/${fullName}/create`,
        method: 'post',
        qs,
    };

    const result = await sendHttpRequest(userOptions);
    const pipelineName = `${result.name}`;
    await _createFirstPipelineFromCreatedRepo(repoOwner, repoName, context, pipelineName);
    return result;
};


module.exports = {
    createRepository,
};