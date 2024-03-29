import * as core from '@actions/core';
import * as aws from 'aws-sdk';

export { getVpcLink };

function getVpcLink(arn) {
  return new aws.APIGateway()
    .getVpcLinks({})
    .promise()
    .then(setOutputs(arn))
    .catch(e => core.setFailed(e.message));
}

const setOutputs = arn => ({ items }) => {
  const link = items.find(x => x.targetArns.includes(arn));
  if (!link) {
    core.setFailed(`Unable to find VPC link for load balancer '${arn}'`);
  }
  return link;
};
