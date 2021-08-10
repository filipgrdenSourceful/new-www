import * as cdk from '@aws-cdk/core'
import { Arn, CfnOutput, Duration, RemovalPolicy } from '@aws-cdk/core'
import { Bucket } from '@aws-cdk/aws-s3'
import {
  CloudFrontWebDistribution,
  OriginAccessIdentity,
  OriginProtocolPolicy,
  ViewerCertificate
} from '@aws-cdk/aws-cloudfront'
import { Effect, PolicyStatement, User } from '@aws-cdk/aws-iam'
import { productionDomainNames, stagingDomainNames } from './domain-names'
import { Certificate } from '@aws-cdk/aws-certificatemanager'
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs'
import { join as pathJoin } from 'path'
import { Runtime } from '@aws-cdk/aws-lambda'
import { Schedule } from '@aws-cdk/aws-events/lib/schedule'
import { Rule } from '@aws-cdk/aws-events'
import { LambdaFunction } from '@aws-cdk/aws-events-targets'

interface WebsiteProps {
  certificateArn: string
  prefix?: string
}

export class Website extends cdk.Stack {
  constructor(scope: cdk.Construct, props: WebsiteProps) {
    super(scope,  'BrightInventionsPl')

    const originAccessIdentity = new OriginAccessIdentity(this, 'cloudfront access')
    const user = new User(this, 'GithubPagesDeploymentUser', {
      userName: 'brightinventions-pl-deployer',
    })

    const productionBucket = new Bucket(this, 'bucket', {
      bucketName: 'brightinventions-pl-website-content',
    })

    const stagingBucket = new Bucket(this, 'staging-bucket', {
      bucketName: 'brightinventions-pl-website-content-staging',
      removalPolicy: RemovalPolicy.DESTROY
    })

    const buckets = [productionBucket, stagingBucket]

    buckets.forEach(bucket => {
      bucket.addLifecycleRule({
        expiration: Duration.days(30),
      })

      bucket.grantRead(originAccessIdentity)

      bucket.grantReadWrite(user)

      // required for static website hosting
      bucket.grantPublicAccess()

      user.addToPolicy(
        new PolicyStatement({
          actions: ['s3:PutBucketWebsite'],
          resources: [bucket.bucketArn],
          effect: Effect.ALLOW,
        })
      )
      user.addToPolicy(
        new PolicyStatement({
          actions: ['s3:PutObjectAcl'],
          resources: [bucket.bucketArn, bucket.arnForObjects('*')],
          effect: Effect.ALLOW,
        })
      )
    })

    const certificate = Certificate.fromCertificateArn(this, 'certificate', props.certificateArn)

    const accessLogs = new Bucket(this, 'Access Logs', {
      removalPolicy: RemovalPolicy.DESTROY,
      bucketName: 'brightinventions-pl-access-logs',
    })
    const cloudfrontAccessLogPrefix = 'brightinventions-pl/cloudfront'

    const productionWebDistribution = new CloudFrontWebDistribution(this, 'distribution', {
      originConfigs: [
        {
          // we don't use s3 origin as gatsby-s3-deploy features will not work
          // however if we don't use gatsby-s3-deploy server side redirects
          // we can get this to work by mapping 403 and 401 in CF to index.html
          customOriginSource: {
            domainName: productionBucket.bucketWebsiteDomainName,
            originProtocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
            },
          ],
        },
      ],
      viewerCertificate: ViewerCertificate.fromAcmCertificate(certificate, {
        aliases: productionDomainNames,
      }),
      loggingConfig: {
        bucket: accessLogs,
        prefix: cloudfrontAccessLogPrefix,
      },
    })


    const stagingWebDistribution = new CloudFrontWebDistribution(this, 'staging-distribution', {
      originConfigs: [
        {
          // we don't use s3 origin as gatsby-s3-deploy features will not work
          // however if we don't use gatsby-s3-deploy server side redirects
          // we can get this to work by mapping 403 and 401 in CF to index.html
          customOriginSource: {
            domainName: stagingBucket.bucketWebsiteDomainName,
            originProtocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
            },
          ],
        },
      ],
      viewerCertificate: ViewerCertificate.fromAcmCertificate(certificate, {
        aliases: stagingDomainNames,
      }),
      loggingConfig: {
        bucket: accessLogs,
        prefix: cloudfrontAccessLogPrefix,
      },
    })

    stagingWebDistribution.node.addDependency(productionWebDistribution)

    const scheduleRate = Duration.days(1)

    const notifyOn404 = new NodejsFunction(this, 'notify-on-404', {
      runtime: Runtime.NODEJS_14_X,
      entry: pathJoin(__dirname, 'notify-on-404.ts'),
      handler: 'find404InS3OnSchedule',
      timeout: Duration.minutes(1),
      environment: {
        BUCKET_NAME: accessLogs.bucketName,
        BUCKET_KEYS_PREFIX: `${cloudfrontAccessLogPrefix}/${productionWebDistribution.distributionId}.`,
        SCHEDULE_RATE_MINUTES: scheduleRate.toMinutes().toString(),
      },
    })

    notifyOn404.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ses:SendEmail'],
        resources: ['*'],
      })
    )

    accessLogs.grantRead(notifyOn404)

    // we could use s3 notification
    // but the logs files are created very often
    // and we'd need to pay more than if we parse the logs on schedule
    // accessLogs.addObjectCreatedNotification(new LambdaDestination(notifyOn404), {
    //       prefix: cloudfrontAccessLogPrefix,
    //     })
    new Rule(this, 'Parse Access Logs', {
      schedule: Schedule.rate(scheduleRate),
      targets: [new LambdaFunction(notifyOn404)],
    })

    user.addToPolicy(
      new PolicyStatement({
        actions: ['cloudfront:CreateInvalidation'],
        resources: [
          Arn.format(
            {
              resource: 'distribution',
              service: 'cloudfront',
              resourceName: productionWebDistribution.distributionId,
              region: '',
            },
            this
          ),
          Arn.format(
            {
              resource: 'distribution',
              service: 'cloudfront',
              resourceName: stagingWebDistribution.distributionId,
              region: '',
            },
            this
          ),
        ],
      })
    )

    new CfnOutput(this, 'ProductionDistributionId', {
      value: productionWebDistribution.distributionId,
    })

    new CfnOutput(this, 'StagingDistributionId', {
      value: stagingWebDistribution.distributionId,
    })

    new CfnOutput(this, 'ProductionDistributionDomainName', {
      value: productionWebDistribution.distributionDomainName,
    })

    new CfnOutput(this, 'StagingDistributionDomainName', {
      value: stagingWebDistribution.distributionDomainName,
    })
  }
}
