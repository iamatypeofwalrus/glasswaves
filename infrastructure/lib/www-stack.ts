import cdk = require('@aws-cdk/cdk');
import s3 = require('@aws-cdk/aws-s3');

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
  }
}