import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";

export class EcsBpMicroservice extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const product = "bp-micro";
    const parameterValue = new cdk.CfnParameter(this, "LBName", {
      type: "String",
      description: "This is a parameter value.",
    });

    const vpc = new cdk.aws_ec2.Vpc(this, `bp-vpc`, {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2,
    });

    const cluster = new cdk.aws_ecs.Cluster(this, `ecs-cluster`, {
      clusterName: `ecs-cluster`,
      vpc: vpc,
    });

    const imageAsset = new cdk.aws_ecr_assets.DockerImageAsset(
      this,
      `${product}-image`,
      {
        directory: path.join(__dirname, "../../backend"),
        platform: Platform.LINUX_ARM64,
      }
    );

    const image = cdk.aws_ecs.ContainerImage.fromDockerImageAsset(imageAsset);

    const task = new cdk.aws_ecs.FargateTaskDefinition(this, `${product}-td`, {
      memoryLimitMiB: 512,
      cpu: 256,
      runtimePlatform: {
        operatingSystemFamily: cdk.aws_ecs.OperatingSystemFamily.LINUX,
        cpuArchitecture: cdk.aws_ecs.CpuArchitecture.ARM64,
      },
    });

    const container = task.addContainer(`${product}-container`, {
      containerName: `${product}`,
      image,
      portMappings: [{ containerPort: 80 }],
      logging: cdk.aws_ecs.LogDriver.awsLogs({
        streamPrefix: `${product}`,
      }),
    });
    const sg = new cdk.aws_ec2.SecurityGroup(this, `${product}-sg`, {
      vpc,
      allowAllOutbound: true,
    });
    sg.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(808),
      "Allowing traffic to the backend"
    );

    const service = new cdk.aws_ecs.FargateService(this, `${product}-service`, {
      cluster,
      serviceName: `${product}-service`,
      taskDefinition: task,
      securityGroups: [sg],
      desiredCount: 1,
      assignPublicIp: false,
    });

    const lb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      `${product}-lb`,
      {
        vpc,
        internetFacing: true,
        loadBalancerName: parameterValue.valueAsString,
      }
    );
    const listener = lb.addListener(`${product}-listener`, {
      port: 808,
      protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
    });
    const tg = listener.addTargets(`${product}-targets`, {
      port: 80,
      protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
      targets: [service],
      deregistrationDelay: cdk.Duration.seconds(1),
      targetGroupName: `${product}-targets`,
    });
    const scaling = service.autoScaleTaskCount({ maxCapacity: 10 });
    scaling.scaleOnRequestCount("RequestScaling", {
      requestsPerTarget: 500,
      targetGroup: tg,
    });
  }
}
