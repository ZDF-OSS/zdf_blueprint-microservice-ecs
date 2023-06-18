#!/bin/bash
set +e

cd cdk
echo "Removing ressources"
cdk destroy

cd ..