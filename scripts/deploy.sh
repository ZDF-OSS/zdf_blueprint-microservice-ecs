#!/bin/bash
set +e

LOAD_BALANCER_NAME="bp-micro-lb"

cd cdk
# Deploy ressources
cdk deploy --parameters LBName="$LOAD_BALANCER_NAME"

# Retrieve the load balancer description
lb_description=$(aws elbv2 describe-load-balancers --names "$LOAD_BALANCER_NAME")

# Extract the public DNS name from the description using JQ (JSON processor)
public_dns=$(echo "$lb_description" | jq -r '.LoadBalancers[0].DNSName')

# Print the public DNS name
echo "Load Balancer Public DNS: $public_dns"

echo "Testing the microservice..."
curl "$public_dns:808"
cd ..