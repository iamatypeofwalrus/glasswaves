import cdk = require('@aws-cdk/cdk');
import { CertificateRefProps, Certificate } from '@aws-cdk/aws-certificatemanager';
import s3 = require('@aws-cdk/aws-s3');
import { BucketRefProps } from '@aws-cdk/aws-s3';
import route53 = require('@aws-cdk/aws-route53');

export class BaseStack extends cdk.Stack {
  public readonly nakedCertRef: CertificateRefProps
  public readonly wwwCertRef: CertificateRefProps
  public readonly logBucketRef: BucketRefProps
  public readonly hostedZoneRef: route53.HostedZoneRefProps

  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props)

    // ACM imports
    this.nakedCertRef = Certificate.import(this, 'NakedCert', {
      certificateArn: "arn:aws:acm:us-east-1:081732485147:certificate/74db1213-0ee8-4b62-be87-c73785779640"
    }).export()

    this.wwwCertRef = Certificate.import(this, "WwwCert", {
      certificateArn: "arn:aws:acm:us-east-1:081732485147:certificate/e80303e9-4af7-460a-bd04-1d92ef5b013e"
    })

    // S3
    const log = new s3.Bucket(this, 'LogsBucket')
    let logResource = log.findChild('Resource') as s3.cloudformation.BucketResource
    logResource.propertyOverrides.accessControl = "LogDeliveryWrite"

    this.logBucketRef = log.export()

    // Route 53
    const zone = new route53.PublicHostedZone(this, "GlasswavesHostedZone", {
      zoneName: "glasswaves.co",
      comment: "managed by CDK"
    })

    this.hostedZoneRef = zone.export()

    // There is no construct for an MX record
    new route53.cloudformation.RecordSetResource(this, "MXRecordSet", {
      hostedZoneId: zone.hostedZoneId,
      name: "glasswaves.co.",
      type: "MX",
      ttl: "300",
      resourceRecords: [
        "1 aspmx.l.google.com.",
        "5 alt1.aspmx.l.google.com.",
        "5 alt2.aspmx.l.google.com.",
        "10 aspmx2.googlemail.com.",
        "10 aspmx3.googlemail.com."
      ]
    })

    new route53.TXTRecord(zone, "GoogleSiteVerification", {
      recordName: "glasswaves.co.",
      ttl: 300,
      recordValue: "google-site-verification=K1NLCAdlFJC0LXsFG7Fbjq8wpDnWRtHxQXr2JpeXaww"
    })

    new route53.TXTRecord(zone, "AcmeChallenge", {
      recordName: "_acme-challenge.www.glasswaves.co.",
      ttl: 300,
      recordValue: "6c2kZv5YX27S4lsIV0KtylCEC2zsT27GhyFAfi17_Oc"
    })
  }
}