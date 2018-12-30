import cdk = require('@aws-cdk/cdk');
import { Certificate } from '@aws-cdk/aws-certificatemanager';

// As of the end of 2018 CloudFront distributions only work with ACM certificates
// that are created in us-east-1. This stack creates certificates for Glasswaves 
// that can be used by CloudFront and thus can only be deployed in us-east-1.
// 
// Notes:
// * Each certificate is exported so it's convinient to grab its ARN
// * Each certificate ARN should be imported in the glasswaves-co base stack and exported
//   so the appropriate stack can comsume it
export class CertsStack extends cdk.Stack {  
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    new Certificate(this, "GlasswavesCoCert", {
      domainName: "glasswaves.co"
    }).export()

    new Certificate(this, "WwwCert", {
      domainName: "www.glasswaves.co"
    }).export()
  }
}