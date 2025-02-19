---
author: adam-w
tags:
  - devops
  - AWS
  - spring boot
  - continuous integration
date: 2022-09-30T11:51:07.433Z
meaningfullyUpdatedAt: ""
title: Create CI/CD pipeline in GitLab with AWS CDK, Docker, Spring Boot and Gradle
layout: post
image: /images/mario_blog.png
hidden: false
comments: true
published: true
---
CI/CD process is the backbone of every good performing team. It facilitates the development, testing, and deploying of an app.

<div class="image"><img src="/images/mario_blog.png" alt="pipeline" title="undefined"  /> </div>

Let’s define behaviour of our CI/CD pipeline:

* the app is built and tested with every commit pushed to the repo
* the app is deployed to the stage environment for commits pushed to the master branch (after the successful build and test phase)
* every pipeline on the master branch has an option to deploy the app to the production environment

Deploy will consist with:

* creating docker image 
* pushing docker image to ECR (Amazon Elastic Container Registry)
* creating AWS infrastructure using AWS CDK

## Build and test Spring Boot app with Gradle

### Setting up Spring Boot app

For this guide, I generated Spring Boot app from [Spring Boot initializr](https://start.spring.io/).

Besides, two dependencies were added:

```groovy
implementation("org.springframework.boot:spring-boot-starter-web")
implementation("org.springframework.boot:spring-boot-starter-actuator")
```

Running an app and requesting

```shell
curl -XGET http://localhost:8080/actuator/health
```

  should return 

```json
{"status":"UP"}
```

### GitLab CI configuration

Initializing GitLab CI/CD is very easy. Just create a `.gitlab-ci.yml` file in the root directory of a project.

```yaml
# name of the Docker image, the Docker executor uses to run CI/CD jobs
image: openjdk:17-alpine

# Stages, which define when to run the jobs. For example, stages that run tests after stages that compile the code.
stages:
  - Build
  - Test
    
# build job in Build stage
build:
  stage: Build
  script:
    - ./gradlew bootJar
# The paths keyword determines which files to add to the job artifacts. All paths to files and directories are relative to the repository where the job was created.
  artifacts:
    paths:
      - build/libs/*.jar
    expire_in: 1 week
    
# test job in Test stage
test:
  stage: Test
  needs:
    - build
  script:
    - ./gradlew check
```

In the configuration, two stages were defined:

* Build with job build — compile our code and save resulted jar file in job artifacts
* Test with job test — run all tests in the project

That simple configuration allows us to introduce a continuous integration process in our development.

To speed up our builds we can use Gradle cache. [Here](https://blog.jdriven.com/2021/11/reuse-gradle-build-cache-on-gitlab/) is a nice article on how to do it with GitLab.

### Creating docker image and pushing to ECR

Before creating and pushing docker images to ECR we must first create an ECR repository (in a region that we will be using).

![](https://cdn-images-1.medium.com/max/1600/1*COp66eLs_JAtg7aciwYEeA.png)

Second, we must provide proper ci/cd variables in GitLab from AWS: 

```text
AWS_ACCOUNT_ID, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
```

<div class="important-info"><div>I created a user with admin privileges and I use its credentials in GitLab — it is only for the purpose of this guide and it’s not recommended technic for “real projects”.</div></div>

![](https://cdn-images-1.medium.com/max/1600/1*mClQYzaxrZD9KpBa3q7ZfA.png)
*CI/CD Settings Variables* 

After those steps, we can define a Dockerfile and a job in our pipeline that will create and push docker image.

```dockerfile
FROM openjdk:17-alpine
ARG JAR_FILE=build/libs/\*.jar
COPY ${JAR_FILE} app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
```

In Dockerfile, a path to a jar file must point to a jar file generated by `build` job.

```yaml
image: openjdk:17-alpine

stages:
  - Build
  - Test
  - Deploy Stage

build:
  stage: Build
  script:
    - ./gradlew bootJar
  artifacts:
    paths:
      - build/libs/*.jar
    expire_in: 1 week

test:
  stage: Test
  needs:
    - build
  script:
    - ./gradlew check

docker_image:
  image: docker:stable
  stage: Deploy Stage
  needs:
    - build
    - test
  variables:
    IMAGE_NAME: ci-cd-demo-app
    TAG_LATEST: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME:latest
    TAG_COMMIT: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$IMAGE_NAME:$CI_COMMIT_SHORT_SHA
    DOCKER_TLS_CERTDIR: ""
  services:
    - docker:dind
  before_script:
    - apk add --no-cache aws-cli
  script:
    - aws ecr get-login-password --region $AWS_REGION |
      docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    - docker pull $TAG_LATEST || true
    - docker build --cache-from $TAG_LATEST -t $TAG_COMMIT -t $TAG_LATEST .
    - docker push $TAG_COMMIT
    - docker push $TAG_LATEST
  rules:
    - if: '$CI_COMMIT_REF_NAME == "master"'
      when: on_success
    - when: manual
```

Stage `Deploy Stage` was added and accordingly `docker_image` job. Because of `needs` keyword job can run only after `build` and `test` and will have access to artifacts produced by `build` and `test`. Created image is tagged with commit sha value and “latest”. `rules` define that the job runs automatically on the master branch but can also be triggered manually. 

After running the job `docker_image` an image with our app should be visible in ECR repository.

![](https://cdn-images-1.medium.com/max/1600/1*SvhjgvSXNc-r-K1Jjz7Pvg.png)

### Creating AWS infrastructure using AWS CDK

Install the AWS CDK `npm install -g aws-cdk`, then in the project root run the following commands:

```shell
mkdir infrastructure
cd infrastructure
cdk init app --language typescript
```

Those commands will initialize cdk project in the infrastructure directory.

Our main class is `bin/infrastructrue.ts`. Here we will be creating stacks. Stacks will be defined in `lib` directory.

Let’s create our infrastructure stack:

```typescript
import {Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {AwsLogDriver, Cluster, ContainerImage} from "aws-cdk-lib/aws-ecs";
import {ApplicationLoadBalancedFargateService} from "aws-cdk-lib/aws-ecs-patterns";
import {LogGroup} from "aws-cdk-lib/aws-logs";
import {Vpc} from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";

export class InfrastructureStack extends Stack {

  private readonly TAG_COMMIT: string = process.env.TAG_COMMIT || 'latest'
  private readonly ECR_REPOSITORY_NAME: string = "ci-cd-demo-app"

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, projectEnvSpecificName("VPC"), {
      natGateways: 1
    })

    const cluster = new Cluster(this, projectEnvSpecificName('Cluster'), {
      vpc: vpc
    });

    const service: ApplicationLoadBalancedFargateService = new ApplicationLoadBalancedFargateService(this, projectEnvSpecificName("application-lb-fargate-service"), {
      serviceName: projectEnvSpecificName("fargate-service"),
      cluster: cluster,
      cpu: 512,
      desiredCount: 2,
      listenerPort: 8080,
      memoryLimitMiB: 1024,
      publicLoadBalancer: true,
      taskImageOptions:  {
        containerName: projectEnvSpecificName("ecs-container"),
        image: ContainerImage.fromEcrRepository(ecrRepositoryForService(this,this.ECR_REPOSITORY_NAME), this.TAG_COMMIT),
        containerPort: 8080,
        logDriver: new AwsLogDriver({
          logGroup: new LogGroup(this, projectEnvSpecificName("log-group"), {
            logGroupName: projectEnvSpecificName("app-service"),
            removalPolicy: RemovalPolicy.DESTROY
          }),
          streamPrefix: projectEnvSpecificName(),
        })
      }
    })

    service.targetGroup.configureHealthCheck({
      path: "/actuator/health",
      port: "8080",
      healthyHttpCodes: "200"
    })

    const scalableTaskCount = service.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 4
    });

    scalableTaskCount.scaleOnCpuUtilization(projectEnvSpecificName("service-auto-scaling"), {
      targetUtilizationPercent: 50,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    })
  }
}

export function ecrRepositoryForService(scope: Construct, serviceName: string) {
  return ecr.Repository.fromRepositoryName(scope, `${serviceName} repository`, serviceName)
}

const DEPLOY_ENV: DeployEnv = process.env.DEPLOY_ENV || 'test';

export enum KnownDeployEnv {
  prod = 'prod',
  stage = 'stage',
  test = 'test'
}

export type DeployEnv = KnownDeployEnv | string

export const PROJECT_NAME = "backend";

export function projectEnvSpecificName(name: string = ""): string {
  const prefix = PROJECT_NAME.replace('_', '-') + "-" + DEPLOY_ENV;
  if (name.startsWith(prefix)) {
    return name
  } else {
    return `${prefix}-${name}`
  }
}
```

A lot of stuff is going on here. Let’s explain a little. 😉

First, we are creating `VPC` and ECS `cluster`. Then we are using `ApplicationLoadBalancedFargateService`. This construct will set up fargate service running on ecs cluster frontend by public application load balancer. The important thing here is passing our app image from ECR with a tag equal to commit sha value (image with commit sha tag was pushed in the previous step).

```ts
image: ContainerImage.fromEcrRepository(ecrRepositoryForService(this,this.ECR_REPOSITORY_NAME), this.TAG_COMMIT)
```

Also we are identifying every resource with `projectEnvSpecificName`. It will help us distinguish AWS resources for different environments and projects.

In `/bin/infarstructrue.ts` we define creation of `infrastructrue-stack` and starting point of cdk:

```ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {InfrastructureStack, projectEnvSpecificName} from '../lib/infrastructure-stack';

async function main() {
    const app = new cdk.App();

    new InfrastructureStack(app, projectEnvSpecificName("app-service"))
}

main().catch(er => {
    console.log(er)
    process.exit(1)
})
```

Our infrastructure is set up! Now we need to automize our deployment in GitLab CI/CD.

```yaml
# install necessary dependencies and run our CDK, are used both by deploy_stage and deploy_prod
.deploy:
  image: node:18-alpine
  variables:
# setting TAG_COMMIT variable for CDK
    TAG_COMMIT: $CI_COMMIT_SHORT_SHA
  before_script:
    - cd infrastructure
    - node -v
  script:
    - npm i
    - AWS_REGION=${AWS_REGION:-eu-west-1} DEPLOY_ENV=${DEPLOY_ENV:-test} npm run  cdk -- deploy --all --require-approval ${APPROVAL_LEVEL:-never}

deploy_stage:
  stage: Deploy Stage
  extends:
    - .deploy
  variables:
# setting DEPLOY_ENV variable for CDK
    DEPLOY_ENV: stage
  environment:
    name: stage
# job can be run only after success of jobs: test, docker
  needs:
    - test
    - docker_image
# commits on the master branch are automatically deployed to the stage
  rules:
    - if: '$CI_COMMIT_REF_NAME == "master"'
      when: on_success
    - when: manual

deploy_prod:
  stage: Deploy Prod
# job can be run only on master branch
  only:
    - master
  extends:
    - .deploy
  variables:
# setting DEPLOY_ENV variable for CDK
    DEPLOY_ENV: prod
# job can be run only after success of jobs: test, docker, deploy_stage
  needs:
    - test
    - docker_image
    - deploy_stage
  environment:
    name: prod
# manual deployment
  when: manual

# prevent running additional pipelines in merge requests
workflow:
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      when: never
    - when: always
```

We have defined `.deploy` configuration, `deploy_stage` and `deploy_prod` jobs.

After the success of `deploy_stage` job, we should be able to hit on the `actuator/health` endpoint. The URL to the service will be displayed in job log and also will be available in CloudFormation in the stack outputs.

![](https://cdn-images-1.medium.com/max/1600/1*HzcOBUOneMlaf33ddneD4g.png)
*deploy_stage job log*

![](https://cdn-images-1.medium.com/max/1600/1*DrjxlDNsFXaGhHFUxaF-hg.png)
*CloudFormation backend-stage-app-service outputs*

```shell
curl -XGET http://backe-backe-xrbo7418s6uv-1422097338.eu-central-1.elb.amazonaws.com:8080/actuator/health

{"status":"UP"}
```

<div class="important-info"><div>Remember to destroy unused stacks and remove unused images in ECR to reduce costs in AWS!</div></div>

### Congratulations!

You have created a pipeline for your Spring Boot app with basic AWS infrastructure for two environments!

![](https://cdn-images-1.medium.com/max/1600/1*WgykIb7PTWu0Tqn2b4IZ6w.png)

All of the code is available here: [https://gitlab.com/adam.waniak11/ci-cd-demo-app](https://gitlab.com/adam.waniak11/ci-cd-demo-app/-/tree/master)

Looking for more? Check another tutorial on [how to add RDS Database using AWS CDK](/blog/add-the-rds-database-to-a-spring-boot-app-with-aws-cdk).

<div class='block-button'><h2>Are you a senior backend developer?</h2><div>You might be a great match, if you like programming in TypeScript and Node.js and have the ability to look at the project from a business perspective. Check out our job offer!</div><a href="/jobs/senior-backend-developer-typescript"><button>Apply and join our team</button></a></div>