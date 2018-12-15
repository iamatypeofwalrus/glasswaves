#!/usr/bin/env node
import cdk = require('@aws-cdk/cdk');
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new cdk.App();
new InfrastructureStack(app, 'InfrastructureStack');
app.run();
