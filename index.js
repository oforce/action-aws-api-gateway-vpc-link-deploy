import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as aws from 'aws-sdk';

import { getLoadBalancerDetails } from './src/load-balancer';
import { getVpcLink } from './src/vpc-link';
import { getAuthorizer } from './src/authorizer';
import { generateSwaggerFile } from './src/swagger';

async function run() {
  const required = {
    required: true
  };
  /*
        ✓ get load balancer arn
        ✓ get vpc link id
        ✓ get authorizer name and arn
        ✓ generate the swagger
        ✓ deploy to api gateway
    */

  const loadBalancerName = core.getInput('load-balancer-name', required);
  const loadBalancerPort = core.getInput('load-balancer-port', required);
  const restApiId = core.getInput('rest-api-id', required);
  const stageName = core.getInput('stage-name', required);
  const authorizerName = core.getInput('authorizer-name', required);

  const jqScript = core.getInput('jq-script');
  const swaggerFile = core.getInput('swagger-file');

  const {
    arn: loadBalancerArn,
    dnsName: loadBalancerDnsName
  } = await getLoadBalancerDetails(loadBalancerName).catch(e =>
    core.setFailed(e.message)
  );

  const { id: vpcLinkId } = await getVpcLink(loadBalancerArn).catch(e =>
    core.setFailed(e.message)
  );

  const { arn: authorizerArn } = await getAuthorizer(
    restApiId,
    authorizerName
  ).catch(e => core.setFailed(e.message));

  const { destinationSwaggerFile } = await generateSwaggerFile({
    jqScript,
    swaggerFile,
    loadBalancerDnsName,
    loadBalancerPort,
    authorizerArn,
    authorizerName,
    vpcLinkId
  }).catch(e => core.setFailed(e.message));

  core.setOutput('swagger-file', destinationSwaggerFile);

  // falling down to the cli becase the SDK refuses to upload the swagger file.
  await exec.exec(
    `aws apigateway put-rest-api --rest-api-id ${restApiId} --body file://${destinationSwaggerFile}`
  );

  const client = new aws.APIGateway();

  await client
    .createDeployment({ restApiId, stageName })
    .promise()
    .then(response => core.info(JSON.stringify(response, null, 2)))
    .catch(e => core.setFailed(e.message));
}

export default run;

run();
