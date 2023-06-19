#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { EcsBpMicroservice } from "../lib/ecs-bp-microservice";
import { Tags } from "aws-cdk-lib";

const app = new cdk.App();
const stack = new EcsBpMicroservice(app, "EcsBpMicroservice", {});

// Add a tag to all constructs in the stack
Tags.of(stack).add('team', 'YourTeam');
Tags.of(stack).add('contact', 'contact@zerodotfive.com');
Tags.of(stack).add('costcenter', 'awsdemo');
Tags.of(stack).add('environment', 'dev');