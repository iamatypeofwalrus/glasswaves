#!/usr/bin/env node
import cdk = require('@aws-cdk/cdk');
import {CertsStack} from '../lib/certs-stack';

const app = new cdk.App();
new CertsStack(app, "glasswaves-co-certs");
app.run();
