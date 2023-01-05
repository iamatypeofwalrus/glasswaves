import { App, StackProps, Duration, Stack } from 'aws-cdk-lib';
import { aws_certificatemanager as acm } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_route53 as route53 } from 'aws-cdk-lib';

// Base Stack provides a base amount of infrastructure in order to support hosting many projects under the Glasswaves domain
export class BaseStack extends Stack {
  public readonly nakedCert: acm.ICertificate
  public readonly wildcardCert: acm.ICertificate
  public readonly logBucket: s3.Bucket
  public readonly hostedZone: route53.HostedZone

  constructor(parent: App, name: string, props?: StackProps) {
    super(parent, name, props)

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

    // ACM DNS Validated and Cross region :-)
    this.wildcardCert = new acm.DnsValidatedCertificate(this, "GlasswavesWildcardCertificate", {
      domainName: '*.glasswaves.co',
      hostedZone: this.hostedZone,
      region: 'us-east-1'
    })

    this.nakedCert = new acm.DnsValidatedCertificate(this, "GlasswavesNakedCertV2", {
      domainName: "glasswaves.co",
      hostedZone: this.hostedZone,
      region: 'us-east-1'
    })
  }
}