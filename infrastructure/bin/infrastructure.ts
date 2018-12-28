#!/usr/bin/env node
import cdk = require('@aws-cdk/cdk');
import {CertsStack} from '../lib/certs-stack';
import {WwwStack} from '../lib/www-stack';
import {DeployStack} from '../lib/deploy-stack';

const app = new cdk.App();
const certs = new CertsStack(app, "glasswaves-co-certs");
const www = new WwwStack(app, "glasswaves-co-www", {
  domain: "glasswaves.co",
  subdomain: "www",
  redirectFromRoot: true,
  // TODO this should be in a stack, not hardcoded out here
  hostedZoneId: "Z1J23IWSWEJW4B",
  certificateArn: certs.certificateRef.certificateArn
});
new DeployStack(app, "glasswaves-co-www-deploy", {
  staticBucketArn: www.subdomainBucketRef.bucketArn as string,
  staticBucketName: www.subdomainBucketRef.bucketName as string,
  // TODO this should be resolvable from WwwStack,however I get this error:
  // Unresolved resource dependencies [SubdomainDistributionCFDistributionC530BCE6]
  cloudfrontDistributionArn: "arn:aws:cloudfront::081732485147:distribution/E1D5NVFADA98AR",
  githubSourceProps: {
    owner: "iamatypeofwalrus",
    repo: "glasswaves",
    buildSpecLocation: "www/buildspec.yml"
  }
});
app.run();
