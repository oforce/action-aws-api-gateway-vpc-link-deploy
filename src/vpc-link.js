const core = require('@actions/core');
const aws = require('aws-sdk');

module.exports = { getVpcLink };

async function getVpcLink(arn) {
  try {
    return await new aws.APIGateway()
      .getVpcLinks({})
      .promise()
      .then(setOutputs(arn));
  } catch (e) {
    core.setFailed(e.message);
  }
}

function setOutputs(arn) {
  return ({ items }) => {
    const link = items.find(x => x.targetArns.includes(arn));
    if (!link) {
      core.setFailed(`Unable to find VPC link with load balancer '${arn}'`);
    }
    return link;
  };
}
