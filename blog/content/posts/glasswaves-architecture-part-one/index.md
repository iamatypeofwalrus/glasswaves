---
title: "🤓 A Static Website by Any Other Name"
tags: ['meta', 'architecture', 'serverless']
date: 2020-10-31T15:23:11-07:00
draft: false
---

## Glasswaves
Programmers are familiar with the truism that naming things is hard. The name “Glasswaves” occurred to me when I was working at the Salk Institute which is perched on the cliffs of La Jolla. Not a bad view. Glasswaves for me evokes twilight sessions surfing the emerald green waves of Black’s Beach. The most important property of “Glasswaves”, however, is that it’s a name that’s unlikely to cause me embarrassment in the future. The screen names I chose as a kid have not aged gracefully[^1].

## Architecture
Over the years this website has been hosted on a variety of different services: on a Digital Ocean droplet, Tutum (an infrastructure provider that ran Docker containers), Firebase, Google Cloud, and, for the last few years, as a static website hosted by Amazon’s Simple Storage Service (S3).
It shouldn’t be a surprise to anyone that my cloud toolkit of choice is AWS. I’m ~~an engineer~~ a software manager at Amazon after all.

{{< resize-image src="www-static-website-architecture.png" alt="WWW Static Website Architecture" >}}

You’ll notice that the architecture is serverless. This is the right tradeoff for me. My contract begins and ends at well formatted HTML. My yearly domain name registration is automatic and I don’t even have to rotate a TLS cert!

Even with seven years of building in the cloud I am surprised at how many services this little website touches. Here’s a breakdown:

* [Route 53](https://aws.amazon.com/route53/)
	* Domain name registrar
	* manages hosted zones for different domains
* [Certificate Manager](https://aws.amazon.com/certificate-manager/)
  * Certificates for glasswaves.co, www.glasswaves.co, blog.glasswaves.co
* [CloudFront](https://aws.amazon.com/cloudfront/)
	* Content Delivery Network (CDN) for www.glasswaves.co and blog.glasswaves.co
	* HTTPS for www.glasswaves.co and blog.glasswaves.co
	* Root redirect from glasswaves.co to www.glasswaves.co
* [Simple Storage Service (S3)](https://aws.amazon.com/s3/)
  * Static website hosting for www.glasswaves.co and blog.glasswaves.co
  * Redirect bucket for glasswaves.co to www.glasswaves.co
* [CloudFormation](https://aws.amazon.com/cloudformation/) to manage [infrastructure as code](https://en.m.wikipedia.org/wiki/Infrastructure_as_code)

Increasingly, the only way to manage moderately sophisticated AWS architectures like this is use infrastructure as code.

## Infrastructure as Code as Documentation
I modify the underlying architecture of this website so infrequently that I never remember how this website runs, but it feels like overkill to spend any amount of time on documentation. The only way to stay sane is to encode that knowledge somewhere. CloudFormation is that somewhere.

The traditional way to use CloudFormation is to write your architecture in a YAML or JSON file and pass that to the CloudFormation service to CRUD your AWS resources. When it works it feels like magic, and when it doesn’t you’ll be looking for the nearest window to defenestrate[^2].

[Cloud Development Kit](https://aws.amazon.com/cdk/) converts the vast majority of those hair-pulling-aws-console-debugging-sessions into compile time errors and, since it’s code you can craft high level, you can build reusable constructs. [This website is powered by one I wrote](https://github.com/iamatypeofwalrus/glasswaves/blob/master/infrastructure/lib/static-website-stack.ts#L20).

## Fin
The website part of Glasswaves is one half of the architecture. The other side is a continuous deployment pipeline that builds every commit published to [this git repo](https://github.com/iamatypeofwalrus/glasswaves) and deploys the HTML to S3. 

Let’s cover that later *8-I

[^1]:I’m looking at you “axemurder1010” and “psycho16”. Young horror fans must seem creepy to the outside world.
[^2]: *splat*
