import { App, Stack, StackProps, SecretValue } from 'aws-cdk-lib';
import { BuildSpec, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { aws_codebuild as codebuild } from 'aws-cdk-lib';
import { CloudFrontWebDistribution } from 'aws-cdk-lib/aws-cloudfront';

interface DeployStaticWebsiteStackProps extends StackProps {
  staticBucket: Bucket
  cloudfrontDist: CloudFrontWebDistribution
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
export class DeployStaticWebsiteStack extends Stack {
  constructor(parent: App, name: string, props: DeployStaticWebsiteStackProps) {
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
        // codebuild.LinuxBuildImage.UBUNTU_14_04_NODEJS_8_11_0 is deprecated per documentation using STANDARD_2_0
        // https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-codebuild.LinuxBuildImage.html#static-ubuntu_14_04_nodejs_8_11_0span-classapi-icon-api-icon-deprecated-titlethis-api-element-is-deprecated-its-use-is-not-recommended%EF%B8%8Fspan
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0 //
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
              actionName: 'build-and-deploy',
              project: sourceBuild,
              input: sourceOutput,
              environmentVariables: {
                "S3_BUCKET_NAME": {
                  type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                  value: props.staticBucket.bucketName
                },
                "CLOUDFRONT_ID": {
                  type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                  value: props.cloudfrontDist.distributionId
                }
              }
            })
          ]
        }
      ]
    })
  }
}