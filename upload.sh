#!/bin/bash
yarn install
zip -r lambda.zip node_modules *.js package.json yarn.lock
aws lambda update-function-code --function-name getBoditrax --zip-file fileb://lambda.zip