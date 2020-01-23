const core = require('@actions/core');
const aws = require('aws-sdk');

module.exports = { getAuthorizer };

async function getAuthorizer(restApiId, authorizerName) {
  try {
    return await new aws.APIGateway()
      .getAuthorizers({ restApiId })
      .promise()
      .then(readResponse(authorizerName));
  } catch (e) {
    core.setFailed(e.message);
  }
}

function readResponse(authorizerName) {
  return ({ items }) => {
    const authorizer = items.find(x => x.name === authorizerName);
    if (!authorizer) {
      core.setFailed(`Unable to find authorizer`);
    }
    return {
      id: authorizer.id,
      name: authorizer.name,
      arn: authorizer.providerARNs[0]
    };
  };
}
