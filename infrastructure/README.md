# Glasswaves Infrastructure

## Prequisites
* Github Oath token stored in SSM

## Deploying
### Deploying all stacks
`cdk deploy`

### Deploy a single stack
`cdk deploy glasswaves-co-www`

## Developing
### Useful commands
* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template