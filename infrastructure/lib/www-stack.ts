import cdk = require('@aws-cdk/cdk');
import s3 = require('@aws-cdk/aws-s3');
import cloudfront = require('@aws-cdk/aws-cloudfront');
import route53 = require('@aws-cdk/aws-route53');
import { BucketRefProps } from '@aws-cdk/aws-s3';
import { HostedZoneRef } from '@aws-cdk/aws-route53';
import { ViewerProtocolPolicy, OriginProtocolPolicy } from '@aws-cdk/aws-cloudfront';

interface WwwStackProps extends cdk.StackProps {
  domain: string;
  subdomain: string;
  certificateArn: string;
  hostedZoneId: string;
  redirectFromRoot?: boolean;
}

export class WwwStack extends cdk.Stack {
  public readonly subdomainBucketRef: BucketRefProps
  public readonly subdomainDistributionId: string

  constructor(parent: cdk.App, name: string, props: WwwStackProps) {
    super(parent, name, props);

    const log = this.createLogBucket()
    const subdomainBucket = this.createWebsiteBucket(props.subdomain, props.domain, log)
    this.subdomainBucketRef = subdomainBucket.export();

    const subdomainDist = this.createWebsiteCloudFrontDist(subdomainBucket, props.certificateArn, props.subdomain,props.domain)

    // TODO: this isn't working as the cloudfront distribution is not exportable @ 0.20.0
    this.subdomainDistributionId = subdomainDist.distributionId

    const zone = HostedZoneRef.import(this, "SubdomainHostedZone", {
      zoneName: props.domain,
      hostedZoneId: props.hostedZoneId
    })

    new route53.AliasRecord(zone, "SubdomainRecordSet", {
      recordName: `${props.subdomain}.${props.domain}.`,
      target: subdomainDist
    })

    if (props.redirectFromRoot) {
      const rootBucket = this.createRootBucket(props.subdomain, props.domain, log)
      const rootDist = this.createRootCloudFrontDist(rootBucket, props.domain, props.certificateArn)
      new route53.AliasRecord(zone, "RootRecordSet", {
        recordName: `${props.domain}.`,
        target: rootDist
      })
    }
  }

  createLogBucket(): s3.Bucket {
    const log = new s3.Bucket(this, 'LogsBucket');
    let logResource = log.findChild('Resource') as s3.cloudformation.BucketResource;
    logResource.propertyOverrides.accessControl = "LogDeliveryWrite";

    return log
  }

  createWebsiteBucket(subdomain: string, domain: string, logBucket: s3.Bucket): s3.Bucket {
    let bucket = new s3.Bucket(this, `SubdomainBucket`);
    bucket.grantPublicAccess()
    let bucketResource = bucket.findChild('Resource') as s3.cloudformation.BucketResource;
    bucketResource.propertyOverrides.websiteConfiguration = {
      indexDocument: "index.html",
      errorDocument: "404.html"
    };
    bucketResource.propertyOverrides.loggingConfiguration = {
      destinationBucketName: logBucket.bucketName,
      logFilePrefix: `bucket-access/${subdomain}.${domain}/`
    };

    return bucket
  }

  createRootBucket(subdomain: string, domain: string, logBucket: s3.Bucket): s3.Bucket {
    let bucket = new s3.Bucket(this, "RootBucket");
    bucket.grantPublicAccess()

    let bucketResource = bucket.findChild('Resource') as s3.cloudformation.BucketResource
    bucketResource.propertyOverrides.websiteConfiguration = {
      redirectAllRequestsTo: {
        hostName: `${subdomain}.${domain}`,
        protocol: "https"
      }
    }
    bucketResource.propertyOverrides.loggingConfiguration = {
      destinationBucketName: logBucket.bucketName,
      logFilePrefix: `bucket-access/${domain}/`
    }

    return bucket
  }

  createWebsiteCloudFrontDist(source: s3.Bucket, certificateArn?: string, subdomain?: string, domain?: string): cloudfront.CloudFrontWebDistribution {
    let cloudfrontProps: cloudfront.CloudFrontWebDistributionProps = {
      comment: "Distribution pointing to the subdomain bucket",
      priceClass: cloudfront.PriceClass.PriceClassAll,
      errorConfigurations: [
        {
          errorCode: 404,
          responseCode: 404,
          responsePagePath: "/404.html",
          errorCachingMinTtl: 30
        },
        {
          errorCode: 403,
          responseCode: 404,
          responsePagePath: "/404.html",
          errorCachingMinTtl: 30
        }
      ],
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: source
          },
          behaviors: [
            {
              compress: true,
              isDefaultBehavior: true
            }
          ]
        }
      ]
    }

    if (!!certificateArn) {
      // TODO is the subdomain naked? don't put a period
      cloudfrontProps.aliasConfiguration = {
        acmCertRef: certificateArn,
        names: [
          `${subdomain}.${domain}`
        ]
      }
    }

    return new cloudfront.CloudFrontWebDistribution(this, 'SubdomainDistribution', cloudfrontProps);
  }

  createRootCloudFrontDist(source: s3.Bucket, domain: string, certificateArn?: string): cloudfront.CloudFrontWebDistribution {
    // Ideally, this should be on the S3 Bucket resource itself rather than having to construct it here
    let region = new cdk.AwsRegion()
    let domainName = `${source.bucketName}.s3-website-${region.toString()}.amazonaws.com`

    let props: cloudfront.CloudFrontWebDistributionProps = {
      comment: `Distributions pointing to the root bucket of ${domain}`,
      priceClass: cloudfront.PriceClass.PriceClassAll,
      viewerProtocolPolicy: ViewerProtocolPolicy.AllowAll,
      // the default for defaultRootObject is index.html which causes issues with the redirect bucket.
      // e.g. naked domain + https redirects to www.domain.com/index.html which isn't quite right.
      defaultRootObject: "",
      // Using a custom origin config because we need to point to the S3 website URL not the regular bucket URL.
      // I need to use the S3 website url because only that URL supports redirects. S3 static websites are 
      // HTTP only, hence using HTTPOnly.
      originConfigs: [
        {
          customOriginSource: {
            domainName: domainName,
            originProtocolPolicy: OriginProtocolPolicy.HttpOnly
          },
          behaviors: [
            {
              isDefaultBehavior: true
            }
          ]
        }  
      ]
    }

    if (!!certificateArn) {
      props.aliasConfiguration = {
        acmCertRef: certificateArn,
        names: [
          domain
        ]
      }
    }

    return new cloudfront.CloudFrontWebDistribution(this, "RootDistribution", props)
  }
}