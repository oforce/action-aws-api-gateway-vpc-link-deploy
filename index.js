const core = require('@actions/core');
const exec = require('@actions/exec');
const aws = require('aws-sdk');

const { getLoadBalancerDetails } = require('./src/load-balancer');
const { getVpcLink } = require('./src/vpc-link');
const { getAuthorizer } = require('./src/authorizer');
const { generateSwaggerFile } = require('./src/swagger');

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
  const swaggerFile = core.getInput('swagger-file', required);
  const restApiId = core.getInput('rest-api-id', required);
  const stageName = core.getInput('stage-name', required);
  const authorizerName = core.getInput('authorizer-name', required);

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
    .then(response => core.info(response))
    .catch(e => core.setFailed(e.message));
}

module.exports = run;

/* istanbul ignore next */
if (require.main === module) {
  try {
    run();
  } catch (e) {
    core.setFailed(e.message);
  }
}
