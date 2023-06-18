#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EcsBpMicroservice } from '../lib/ecs-bp-microservice';

const app = new cdk.App();
new EcsBpMicroservice(app, 'EcsBpMicroservice', {

});
