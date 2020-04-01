import cdk = require('@aws-cdk/core');
import { Certificate, ICertificate } from '@aws-cdk/aws-certificatemanager';
import s3 = require('@aws-cdk/aws-s3');
import route53 = require('@aws-cdk/aws-route53');
import { Duration } from '@aws-cdk/core';

// Base Stack provides a base amount of infrastructure in order to support hosting many projects under the Glasswaves domain
export class BaseStack extends cdk.Stack {
  public readonly nakedCert: ICertificate
  public readonly wwwCert: ICertificate
  public readonly logBucket: s3.Bucket
  public readonly hostedZone: route53.HostedZone

  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props)

    // ACM imports
    this.nakedCert = Certificate.fromCertificateArn(
      this,
      'NakedCert',
      "arn:aws:acm:us-east-1:081732485147:certificate/74db1213-0ee8-4b62-be87-c73785779640"
    )

    this.wwwCert = Certificate.fromCertificateArn(
      this,
      "WwwCert",
      "arn:aws:acm:us-east-1:081732485147:certificate/e80303e9-4af7-460a-bd04-1d92ef5b013e"
    )

    // S3
    const log = new s3.Bucket(this, 'LogsBucket')
    let cfnLog = log.node.defaultChild as s3.CfnBucket
    cfnLog.accessControl = 'LogDeliveryWrite'

    this.logBucket = log

    // Route 53
    this.hostedZone = new route53.PublicHostedZone(this, "GlasswavesHostedZone", {
      zoneName: "glasswaves.co",
      comment: "managed by CDK"
    })

    new route53.MxRecord(this, 'MXRecordSet', {
      zone: this.hostedZone,
      recordName: "glasswaves.co.",
      ttl: Duration.minutes(5),
      values: [
        { priority: 1, hostName: "aspmx.l.google.com."},
        { priority: 5, hostName: "alt1.aspmx.l.google.com."},
        { priority: 5, hostName: "alt2.aspmx.l.google.com."},
        { priority: 10, hostName: "aspmx2.googlemail.com."},
        { priority: 10, hostName: "aspmx3.googlemail.com."}
      ]
    })

    new route53.TxtRecord(this, "GoogleSiteVerification", {
      zone: this.hostedZone,
      recordName: "glasswaves.co.",
      ttl: Duration.minutes(5),
      values: [
        "google-site-verification=K1NLCAdlFJC0LXsFG7Fbjq8wpDnWRtHxQXr2JpeXaww"
      ]
    })

    new route53.TxtRecord(this, "AcmeChallenge", {
      zone: this.hostedZone,
      recordName: "_acme-challenge.www.glasswaves.co.",
      ttl: Duration.minutes(5),
      values: [
        "6c2kZv5YX27S4lsIV0KtylCEC2zsT27GhyFAfi17_Oc"
      ]
    })
  }
}