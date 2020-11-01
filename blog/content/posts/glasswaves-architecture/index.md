---
title: "A Static Website by Any Other Name"
date: 2020-10-31T15:23:11-07:00
draft: false
---

## Glasswaves
Programmers are familiar with the truism that naming things is hard. Choosing a DNS name doubly so. The moniker “Glasswaves” occurred to me while toiling away in a lab at the Salk Institute, itself perched on the cliffs of La Jolla over looking Black’s Beach. Glasswaves for me evokes a Californian dream of surfing emerald green waves in twilight. It’s most important property, however, is that it’s unlikely to cause me embarrassment on my deathbed[^1].

Over the years this website has been hosted on a variety of different services: on a Digital Ocean droplet, Tutum (an infrastructure provider that ran Docker containers), Firebase, Google Cloud, and, for the last few years, as a static website hosted by Amazon’s Simple Storage Service (S3).

I’m an engineer at Amazon so it shouldn’t be a surprise to anyone that my cloud toolkit of choice is AWS. S3 is the right tradeoff for me. AWS engineers are the ones holding the pager, not me. Every service in the hot path of a HTTP request is web scale. (Do people still say that?)

## How it works
{{< resize-image src="www-static-website-architecture.png" alt="WWW Static Website Architecture" >}}

I like this architecture because it’s serverless. My contract begins and ends at well formatted HTML. Yearly domain name registrations are automatic. I don’t even have to rotate a TLS cert.

I’m surprised at how many different services I need[^1] to use to run this website even with 7 years of experience building stuff in the cloud. Here’s a breakdown:

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

## Infrastructure as Code as Documentation
I constantly forget how this website runs, but it also feels like overkill to spend any amount of time on documentation. Since moving everything to AWS the amount of different services I’ve used has exploded. The only way to stay sane is to encode that knowledge somewhere. CloudFormation is that somewhere.

The traditional way to use CloudFormation is to write your architecture in a YAML or JSON file and pass that to the CloudFormation service to CRUD your AWS resources. When it works it feels like magic, and when it doesn’t you’ll be looking for the nearest window to defenestrate[^2].

[Cloud Development Kit](https://aws.amazon.com/cdk/) converts the vast majority of those hair-pulling-aws-console-debugging-sessions into compile time errors and since it’s just code you can craft high level, reusable constructs. [This website is powered by one I wrote](https://github.com/iamatypeofwalrus/glasswaves/blob/master/infrastructure/lib/static-website-stack.ts#L20).

## Fin
The website part of Glasswaves is just one half of the architecture. The other side is a continuous deployment pipeline that builds every commit published to [this git repo](https://github.com/iamatypeofwalrus/glasswaves) and deploys the HTML to S3. 

Let’s cover that later *8-I

[^1]:I’m looking at you “axemurder1010” and “psycho16”. Young horror fans must seem creepy to the outside world.
[^2]: *splat*
	