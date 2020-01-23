import * as exec from '@actions/exec';
import * as fs from 'fs';

export { generateSwaggerFile };

async function generateSwaggerFile({
  jqScript,
  swaggerFile,
  loadBalancerDnsName,
  loadBalancerPort,
  authorizerName,
  authorizerArn,
  vpcLinkId
}) {
  await exec.exec(`curl -o api-gateway.jq ${jqScript}`);

  function arg(name, value) {
    return `--arg ${name} "${value}"`;
  }

  let out = '';

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
