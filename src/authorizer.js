const core = require('@actions/core');
const aws = require('aws-sdk');

module.exports = { getAuthorizer };

function getAuthorizer(restApiId, authorizerName) {
  return new aws.APIGateway()
    .getAuthorizers({ restApiId })
    .promise()
    .then(readResponse(authorizerName))
    .catch(e => core.setFailed(e.message));
}

const readResponse = authorizerName => ({ items }) => {
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
