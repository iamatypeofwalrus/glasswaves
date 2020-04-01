import cdk = require('@aws-cdk/core');
import { BuildSpec, PipelineProject } from '@aws-cdk/aws-codebuild';
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import { CodeBuildAction, GitHubSourceAction } from '@aws-cdk/aws-codepipeline-actions';
import { PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { Bucket } from '@aws-cdk/aws-s3';
import { SecretValue } from '@aws-cdk/core';
import codebuild = require('@aws-cdk/aws-codebuild');

interface DeployStaticWebsiteStackProps extends cdk.StackProps {
  staticBucket: Bucket;
  githubSourceProps: GithubSourceProps
}

interface GithubSourceProps {
  owner: string,
  repo: string,
  buildSpecLocation: string
  oathTokenSecretArn: string
}

// DeployStaticWebsiteStack is a bare bones implementation of of a Continuous Deployment stack that will:
// * Listen for changes on a Github repo
// * Build those changes
//
// The BuildRole has permissions to CRUD within the provided S3 bucket and create CloudFront invalidations
export class DeployStaticWebsiteStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: DeployStaticWebsiteStackProps) {
    super(parent, name, props);

    let buildRole = new Role(this, 'BuildRole', {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com')
    })

    let s3Policy = new PolicyStatement()
    s3Policy.addResources(props.staticBucket.bucketArn, `${props.staticBucket.bucketArn}/*`)
    s3Policy.addActions("s3:ListBucket", "s3:GetObject", "s3:GetBucketLocation", "s3:PutObject", "s3:DeleteObject")
    buildRole.addToPolicy(s3Policy)

    let cloudfrontPolicy = new PolicyStatement()
    cloudfrontPolicy.addAllResources() // TODO try to narrow this down
    cloudfrontPolicy.addActions("cloudfront:CreateInvalidation")
    buildRole.addToPolicy(cloudfrontPolicy)

    const sourceBuild = new PipelineProject(this, 'StaticBuild', {
      environment: {
        computeType: codebuild.ComputeType.SMALL,
        buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_NODEJS_8_11_0
      },
      buildSpec: BuildSpec.fromSourceFilename(props.githubSourceProps.buildSpecLocation),
      role: buildRole,
    })
    const sourceOutput = new Artifact()

    new Pipeline(this, 'Pipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [
            new GitHubSourceAction({
              actionName: "GithubSource",
              branch: "master", // TODO: make this configurable
              oauthToken: SecretValue.secretsManager(props.githubSourceProps.oathTokenSecretArn),
              owner: props.githubSourceProps.owner,
              repo: props.githubSourceProps.repo,
              output: sourceOutput
            })
          ]
        },
        {
          stageName: 'Build',
          actions: [
            new CodeBuildAction({
              actionName: 'Glasswaves Build and Deploy',
              project: sourceBuild,
              input: sourceOutput
            })
          ]
        }
      ]
    })
  }
}