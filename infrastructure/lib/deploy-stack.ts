import cdk = require('@aws-cdk/cdk');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codebuild = require('@aws-cdk/aws-codebuild');
import { Role, ServicePrincipal, PolicyStatement } from '@aws-cdk/aws-iam';

export class DeployStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);
    
    let githubOathToken = new cdk.SecretParameter(this, "GithubOathToken", {
      ssmParameter: "GithubOathToken"
    })
    let pipeline = new codepipeline.Pipeline(this, 'GlasswavesWwwPipeline');

    // Source Stage
    let sourceStage = pipeline.addStage('Source', {
      placement: {
        atIndex: 0
      }
    });
    let sourceAction = new codepipeline.GitHubSourceAction(this, 'GlasswavesWwwGithubSource', {
      stage: sourceStage,
      owner: "iamatypeofwalrus",
      repo: "glasswaves",
      oauthToken: githubOathToken.value,
      outputArtifactName: "SourceOutput"
    });

    // Build Stage
    let buildStage = pipeline.addStage('Build', {placement: {atIndex: 1}});
    let buildRole = new Role(this, 'GlasswavesWwwBuildRole', {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com')
    })

    // TODO: will eventually need permissions to make cloudfront changes
    buildRole.addToPolicy(
      new PolicyStatement()
        .addAction("logs:CreateLogGroup")
        .addAction("logs:CreateLogStream")
        .addAction("logs:PutLogEvents")
        .addResource(
          new cdk.FnSub("arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/codebuild/*").toString()
        )
    );
    buildRole.addToPolicy(
      new PolicyStatement()
        // TODO: need a reference to the S3 bucket
        .addResource("arn:aws:s3:::glasswaves-co-www-cdk-wwwbucket57cb15e7-18997wjtgpbd8")
        // TODO: what are the minimum permissions needed to sync a bucket?
        .addAction("s3:*")
    );

    let buildProject = new codebuild.Project(this, 'GlasswavesWwwBuild', {
      environment: {
        computeType: codebuild.ComputeType.Small,
        buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_NODEJS_8_11_0
      },
      buildSpec: {
        version: "0.2",
        phases: {
          build: {
            commands: [
              'echo Hello, CodeBuild!',
              // TODO: how do I paramaterize this?
              // TODO: use aws s3 sync command in order to capture deleted items
              'aws s3 cp ./www/src s3://glasswaves-co-www-cdk-wwwbucket57cb15e7-18997wjtgpbd8/ --recursive --cache-control max-age=86400'
            ]
          }
        }
      },
      source: new codebuild.CodePipelineSource(),
      role: buildRole
    });
    new codebuild.PipelineBuildAction(this, 'GlasswavesWwwBuildAction', {
      project: buildProject,
      stage: buildStage,
      inputArtifact: sourceAction.outputArtifact
    });
  }
}