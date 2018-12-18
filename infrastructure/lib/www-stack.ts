import cdk = require('@aws-cdk/cdk');
import s3 = require('@aws-cdk/aws-s3');
import cloudfront = require('@aws-cdk/aws-cloudfront');

// TODO:
// * accept root domain name e.g. glasswaves.co
// * an ACM certificate arn
// * HostedZoneId to create attach to a Route 53 record set like
//  RootRecordSet:
//  Type: "AWS::Route53::RecordSet"
//  Properties:
//  Type: "A"
//  Name: glasswaves.co.
//    HostedZoneId:
//  Fn:: ImportValue: glasswaves - co - hostedzone
//  AliasTarget:
//  HostedZoneId: Z2FDTNDATAQYW2
//  DNSName:
//  Fn:: GetAtt:
//  - RootCloudfrontDistribution
//    - DomainName

export class WwwStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    let log = new s3.Bucket(this, 'LogsBucket');
    let logResource = log.findChild('Resource') as s3.cloudformation.BucketResource;
    logResource.propertyOverrides.accessControl = "LogDeliveryWrite";

    let www = new s3.Bucket(this, 'WwwBucket');
    www.grantPublicAccess()
    let wwwResource = www.findChild('Resource') as s3.cloudformation.BucketResource;
    wwwResource.propertyOverrides.websiteConfiguration = {
      indexDocument: "index.html",
      errorDocument: "404.html"
    };
    wwwResource.propertyOverrides.loggingConfiguration = {
      destinationBucketName: log.bucketName,
      logFilePrefix: "www/"
    };

    www.export();

    new cloudfront.CloudFrontWebDistribution(this, 'WwwDistribution', {
      comment: "Distribution pointing to the www bucket",
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
            s3BucketSource: www
          },
          behaviors: [
            {
              compress: true,
              isDefaultBehavior: true
            }
          ]
        }
      ]
    });
  }
}