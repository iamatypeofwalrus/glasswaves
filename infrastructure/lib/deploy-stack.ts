import cdk = require('@aws-cdk/cdk');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codebuild = require('@aws-cdk/aws-codebuild');
import { Role, ServicePrincipal, PolicyStatement } from '@aws-cdk/aws-iam';

interface DeployStackProps extends cdk.StackProps {
  staticBucketArn: string;
  staticBucketName: string;
  cloudfrontDistributionArn: string;
  githubSourceProps: GithubSourceProps
}

interface GithubSourceProps {
  owner: string,
  repo: string,
  buildSpecLocation: string
}

export class DeployStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: DeployStackProps) {
    super(parent, name, props);
    
    // NOTE: using SSM since that's the default for cdk.Secret which is required by
    // the GitHubSourceAction. I would prefer to use SecretsManager going forward.
    // Open up a issue in CDK?
    let githubOathToken = new cdk.SecretParameter(this, "GithubOathToken", {
      ssmParameter: "GithubOathToken"
    })
    let pipeline = new codepipeline.Pipeline(this, 'Pipeline');

    // Source Stage
    let sourceStage = pipeline.addStage('Source', {
      placement: {
        atIndex: 0
      }
    });
    let sourceAction = new codepipeline.GitHubSourceAction(this, 'Source', {
      stage: sourceStage,
      owner: props.githubSourceProps.owner,
      repo: props.githubSourceProps.repo,
      oauthToken: githubOathToken.value,
      outputArtifactName: "SourceOutput"
    });

    // Build Stage
    let buildStage = pipeline.addStage('Build', {placement: {atIndex: 1}});
    let buildRole = new Role(this, 'BuildRole', {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com')
    })

    buildRole.addToPolicy(
      new PolicyStatement()
        .addResource(props.staticBucketArn)
        .addResource(`${props.staticBucketArn}/*`)
        .addAction("s3:ListBucket")
        .addAction("s3:GetObject")
        .addAction("s3:GetBucketLocation")
        .addAction("s3:PutObject")
        .addAction("s3:DeleteObject")
    );

    buildRole.addToPolicy(
      new PolicyStatement()
        // TODO: try to narrow this down to the specific cloudfront distribution
        .addResource("*")
        .addAction("cloudfront:CreateInvalidation")
    )

    let buildProject = new codebuild.Project(this, 'Build', {
      environment: {
        computeType: codebuild.ComputeType.Small,
        buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_NODEJS_8_11_0
      },
      source: new codebuild.CodePipelineSource(),
      buildSpec: props.githubSourceProps.buildSpecLocation,
      role: buildRole
    });

    new codebuild.PipelineBuildAction(this, 'BuildAction', {
      project: buildProject,
      stage: buildStage,
      inputArtifact: sourceAction.outputArtifact
    });
  }
}