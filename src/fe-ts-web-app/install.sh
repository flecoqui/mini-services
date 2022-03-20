#!/bin/bash
parent_path=$(
    cd "$(dirname "${BASH_SOURCE[0]}")/../../"
    pwd -P
)
# Read variables in configuration file
SCRIPTS_DIRECTORY=`dirname $0`
echo "${SCRIPTS_DIRECTORY}"
pushd ${SCRIPTS_DIRECTORY}
npm init -y
npm install
popd
