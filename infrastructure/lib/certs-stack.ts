import cdk = require('@aws-cdk/cdk');
import { Certificate, CertificateRefProps } from '@aws-cdk/aws-certificatemanager';

export class CertsStack extends cdk.Stack {
  public readonly certificateRef: CertificateRefProps
  
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    // TODO: create a new certificate that's built into CDK.
    let cert = Certificate.import(this, "GlasswavesCert", {
      certificateArn: "arn:aws:acm:us-east-1:081732485147:certificate/8d9a3dae-e8d4-44a8-ad59-a34291aca1aa"
    });

    this.certificateRef = cert.export()
  }
}