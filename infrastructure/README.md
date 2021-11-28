# Glasswaves Infrastructure

## Prequisites
* Github personal access Oath token stored in Secrets Manager in us-west-2

## Development
### Setup
Install:
```
npm install
```

### Add a new CDK library
e.g.
```sh
npm install --save @aws-cdk/aws-route53-targets@1.1.0
```

## Deploying
### List stacks
`cdk list`
### Deploying all stacks
`cdk deploy`

### Deploy a single stack
`cdk deploy glasswaves-co-www`

### Deploy blog stack
`cdk deploy glasswaves-co-www-deploy`

## Developing
### Code space
* Vscode - `Tasks: Run Build Command` - NPM  Watch - Infrastructure
    * watches files for changes in the background
* `npx cdk` <- run CDK command
    * TODO - add alias to this in the env

### Useful commands
* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
