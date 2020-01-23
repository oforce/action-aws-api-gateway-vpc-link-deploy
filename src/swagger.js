const exec = require('@actions/exec');
const fs = require('fs');

module.exports = { generateSwaggerFile };

async function generateSwaggerFile({
  swaggerFile,
  loadBalancerDnsName,
  loadBalancerPort,
  authorizerName,
  authorizerArn,
  vpcLinkId
}) {
  await exec.exec(
    'curl -o api-gateway.jq https://raw.githubusercontent.com/oforce/github/master/actions/aws-api-gateway-deploy/src/api-gateway.jq',
    [],
    { silent: true }
  );

  let out = '';

  function arg(name, value) {
    return `--arg ${name} "${value}"`;
  }

  await exec.exec(
    `jq ${arg('url', `${loadBalancerDnsName}:${loadBalancerPort}`)} ${arg(
      'authorizer_name',
      authorizerName
    )} ${arg('authorizer', authorizerArn)} ${arg(
      'vpc_link_id',
      vpcLinkId
    )} -f api-gateway.jq ${swaggerFile}`,
    [],
    {
      listeners: {
        stdout: data => (out += data.toString())
      }
    }
  );

  const destinationSwaggerFile = 'api-gateway-swagger.json';
  fs.writeFileSync(destinationSwaggerFile, out);
  return { destinationSwaggerFile };
}
