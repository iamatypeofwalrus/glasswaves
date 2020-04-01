import cdk = require('@aws-cdk/core');
import { Certificate } from '@aws-cdk/aws-certificatemanager';

// As of the end of 2018 CloudFront distributions only work with ACM certificates
// that are created in us-east-1. This stack creates certificates for Glasswaves 
// that can be used by CloudFront and thus can only be deployed in us-east-1.
export class CertsStack extends cdk.Stack {  
  public nakedCert: Certificate
  public wwwCert: Certificate

  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    new Certificate(this, "GlasswavesCoCert", {
      domainName: "glasswaves.co"
    })

    new Certificate(this, "WwwCert", {
      domainName: "www.glasswaves.co"
    })
  }
}