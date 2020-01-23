const core = require('@actions/core');
const aws = require('aws-sdk');

module.exports = { getLoadBalancerDetails };

async function getLoadBalancerDetails(name) {
  try {
    return await new aws.ELBv2()
      .describeLoadBalancers({ Names: [name] })
      .promise()
      .then(readResponse(name));
  } catch (e) {
    core.setFailed(e.message);
  }
}

function readResponse(loadBalancerName) {
  return ({ LoadBalancers }) => {
    if (LoadBalancers.length > 1) {
      core.setFailed(
        `Found more than one load balancer with the name '${loadBalancerName}'`
      );
    } else {
      const [{ LoadBalancerArn, DNSName }] = LoadBalancers;
      return { arn: LoadBalancerArn, dnsName: DNSName };
    }
  };
}
