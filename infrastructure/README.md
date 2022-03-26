# Glasswaves Infrastructure
## Prequisites
* Github personal access Oath token stored in Secrets Manager in us-west-2

## Development
### Setup
* install `npm install`
* VS Code - `Tasks: Run Build Command` - NPM  Watch - Infrastructure
    * watches files for changes in the background
    * or run the following from the terminal
        * `npm run build`   compile typescript to js
        * `npm run watch`   watch for changes and compile

* `npx cdk <CDK ZCOMMAND>`
    * see below for more commands

### Add a new CDK library
e.g.

```sh
npm install --save @aws-cdk/aws-route53-targets@1.1.0
```

## Using CDk
### List stacks
`npx cdk list`

### Deploying all stacks
`npx cdk deploy`

### Deploy a single stack
`npx cdk deploy glasswaves-co-www`

### Deploy blog stack
`npx cdk deploy glasswaves-co-www-deploy`

### Compare deployed stack with current state
`npx cdk diff`        

### Emit CloudFormation Template
`npx cdk synth`
