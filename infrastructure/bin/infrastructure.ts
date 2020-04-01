#!/usr/bin/env node
import cdk = require('@aws-cdk/core')
import { CertsStack } from '../lib/certs-stack'
import { WwwStack } from '../lib/www-stack'
import { DeployStaticWebsiteStack } from '../lib/deploy-static-website-stack'
import { BaseStack } from '../lib/base-stack'

const app = new cdk.App()

new CertsStack(app, "glasswaves-co-certs", {env: {region: "us-east-1"}})

const base = new BaseStack(app, "glasswaves-co")

const www = new WwwStack(app, "glasswaves-co-www", {
  domain: "glasswaves.co",
  subdomain: "www",
  redirectFromRoot: true,
  hostedZone: base.hostedZone,
  subdomainCertificate: base.wwwCert,
  domainCertificate: base.nakedCert,
  logBucket: base.logBucket
})

new DeployStaticWebsiteStack(app, "glasswaves-co-www-deploy", {
  staticBucket: www.subdomainBucket,
  githubSourceProps: {
    owner: "iamatypeofwalrus",
    repo: "glasswaves",
    buildSpecLocation: "www/buildspec.yml",
    oathTokenSecretArn: "arn:aws:secretsmanager:us-west-2:081732485147:secret:GithubOathToken-WWDJjO"
  }
})

app.synth()
