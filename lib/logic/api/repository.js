const CFError = require('cf-errors'); // eslint-disable-line
const {
    sendHttpRequest
} = require('./helper');
const {
    createPipeline
} = require('./pipeline');

async function _createFirstPipelineFromCreatedRepo(repoOwner, repoName, context) {
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
            name: `${repoOwner}/${repoName}/${repoName}`,
            labels: {
                tags: [],
            },
            deprecate: {
                repoPipeline: true,
                basic: true,
                template: 'Ubuntu',
                context,
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
    const res = await createPipeline(pipeline);
    console.log(res);
    return res;
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
    console.log(result);
    const pipelineName = `${result.name}`;
    await _createFirstPipelineFromCreatedRepo(repoOwner, repoName, context, pipelineName);
    return result;
};


module.exports = {
    createRepository,
};