import core from '@actions/core';
import aws from 'aws-sdk';

export { getLoadBalancerDetails };

function getLoadBalancerDetails(name) {
  return new aws.ELBv2()
    .describeLoadBalancers({ Names: [name] })
    .promise()
    .then(readResponse(name))
    .catch(e => core.setFailed(e.message));
}

const readResponse = loadBalancerName => ({ LoadBalancers }) => {
  if (LoadBalancers.length > 1) {
    core.setFailed(
      `Found more than one load balancer with the name '${loadBalancerName}'`
    );
  } else {
    const [{ LoadBalancerArn, DNSName }] = LoadBalancers;
    return { arn: LoadBalancerArn, dnsName: DNSName };
  }
};
