#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { StaticWebsiteStack } from '../lib/static-website-stack'
import { DeployStaticWebsiteStack } from '../lib/deploy-static-website-stack'
import { BaseStack } from '../lib/base-stack'

const app = new App()

const base = new BaseStack(app, "glasswaves-co")

const www = new StaticWebsiteStack(app, "glasswaves-co-www", {
  domain: "glasswaves.co",
  subdomain: "www",
  redirectFromRoot: true,
  hostedZone: base.hostedZone,
  subdomainCertificate: base.wildcardCert,
  domainCertificate: base.nakedCert,
  logBucket: base.logBucket
})

new DeployStaticWebsiteStack(app, "glasswaves-co-www-deploy", {
  staticBucket: www.subdomainBucket,
  cloudfrontDist: www.subdomainDistribution,
  githubSourceProps: {
    owner: "iamatypeofwalrus",
    repo: "glasswaves",
    buildSpecLocation: "www/buildspec.yml",
    oathTokenSecretArn: "arn:aws:secretsmanager:us-west-2:081732485147:secret:GithubOathToken-WWDJjO"
  }
})

app.synth()
