import cdk = require('@aws-cdk/cdk');
import codepipeline = require('@aws-cdk/aws-codepipeline');
import codebuild = require('@aws-cdk/aws-codebuild');

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
    let buildProject = new codebuild.Project(this, 'GlasswavesWwwBuild', {
      environment: {
        computeType: codebuild.ComputeType.Small,
        buildImage: codebuild.LinuxBuildImage.UBUNTU_14_04_NODEJS_8_11_0
      },
      source: new codebuild.CodePipelineSource()
    });
    new codebuild.PipelineBuildAction(this, 'GlasswavesWwwBuildAction', {
      project: buildProject,
      stage: buildStage,
      inputArtifact: sourceAction.outputArtifact
    });
  }
}