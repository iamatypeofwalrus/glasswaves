#!/usr/bin/env node
import cdk = require('@aws-cdk/cdk');
import {CertsStack} from '../lib/certs-stack';
import {WwwStack} from '../lib/www-stack';
import {DeployStack} from '../lib/deploy-stack';

const app = new cdk.App();
new CertsStack(app, "glasswaves-co-certs");
new WwwStack(app, "glasswaves-co-www-cdk");
new DeployStack(app, "glasswaves-co-www-deploy");
app.run();
