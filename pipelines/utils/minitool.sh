#!/bin/bash
##########################################################################################################################################################################################
#- Purpose: Script used to install pre-requisites, deploy/undeploy service, start/stop service, test service
#- Parameters are:
#- [-a] action - value: login, install, deploy, undeploy, buildcontainer, deploycontainer, integration
#- [-e] Stop on Error - by default false
#- [-s] Silent mode - by default false
#- [-c] configuration file - which contains the list of path of each avtool.sh to call (avtool.env by default)
#
# executable
###########################################################################################################################################################################################
set -u
#repoRoot="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
parent_path=$(
    cd "$(dirname "${BASH_SOURCE[0]}")/../../"
    pwd -P
)
# Read variables in configuration file
SCRIPTS_DIRECTORY=`dirname $0`
source "$SCRIPTS_DIRECTORY"/common.sh


# container version (current date)
export APP_VERSION=$(date +"%y%m%d.%H%M%S")
# container internal HTTP port
export APP_PORT=80
# webapp prefix 
export AZURE_APP_PREFIX="mini01"

#######################################################
#- function used to print out script usage
#######################################################
function usage() {
    echo
    echo "Arguments:"
    echo -e " -a  Sets MTS Tool action {login, install, deploy, undeploy, buildcontainer, deploycontainer, integration}"
    echo -e " -c  Sets the MTS Tool configuration file"
    echo -e " -e  Sets the stop on error (false by defaut)"
    echo -e " -e  Sets Silent mode installation or deployment (false by defaut)"
    echo
    echo "Example:"
    echo -e " bash ./mtstool.sh -a install "
    echo -e " bash ./mtstool.sh -a deploy -c .mtstool.env -e true -s true"
    
}

action=
configuration_file="$(dirname "${BASH_SOURCE[0]}")/../../configuration/.default.env"
stoperror=false
silentmode=false
while getopts "a:c:e:s:hq" opt; do
    case $opt in
    a) action=$OPTARG ;;
    c) configuration_file=$OPTARG ;;
    e) stoperror=$OPTARG ;;
    s) silentmode=$OPTARG ;;
    :)
        echo "Error: -${OPTARG} requires a value"
        exit 1
        ;;
    *)
        usage
        exit 1
        ;;
    esac
done

# Validation
if [[ $# -eq 0 || -z $action || -z $configuration_file ]]; then
    echo "Required parameters are missing"
    usage
    exit 1
fi
if [[ ! $action == login && ! $action == install && ! $action == deploycontainer && ! $action == buildcontainer && ! $action == deploy && ! $action == deploycosmos && ! $action == undeploy && ! $action == integration ]]; then
    echo "Required action is missing, values: login, install, deploy, deploycosmos, undeploy, deploycontainer, buildcontainer, integration"
    usage
    exit 1
fi
# colors for formatting the ouput
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[0;31m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color




# check if configuration file is set 
if [[ -z $configuration_file ]]; then
    configuration_file="$(dirname "${BASH_SOURCE[0]}")/../../configuration/.default.env"
fi

# get Azure Subscription and Tenant Id if already connected
AZURE_SUBSCRIPTION_ID=$(az account show --query id --output tsv 2> /dev/null) || true
AZURE_TENANT_ID=$(az account show --query tenantId -o tsv 2> /dev/null) || true

# check if configuration file is set 
if [[ -z ${AZURE_SUBSCRIPTION_ID} || -z ${AZURE_TENANT_ID}  ]]; then
    printError "Connection to Azure required, launching 'az login'"
    printMessage "Login..."
    azLogin
    checkLoginAndSubscription
    printMessage "Login done"    
    AZURE_SUBSCRIPTION_ID=$(az account show --query id --output tsv 2> /dev/null) || true
    AZURE_TENANT_ID=$(az account show --query tenantId -o tsv 2> /dev/null) || true
fi
AZURE_APP_PREFIX="mini$(shuf -i 1000-9999 -n 1)"


# Check if configuration file exists
if [[ ! -f "$configuration_file" ]]; then
    cat > "$configuration_file" << EOF
AZURE_REGION="eastus2"
AZURE_APP_PREFIX=${AZURE_APP_PREFIX}
AZURE_SUBSCRIPTION_ID=${AZURE_SUBSCRIPTION_ID}
AZURE_TENANT_ID=${AZURE_TENANT_ID}
EOF
fi

if [[ $configuration_file ]]; then
    if [ ! -f "$configuration_file" ]; then
        printError "$configuration_file does not exist."
        exit 1
    fi
    set -o allexport
    source "$configuration_file"
    set +o allexport
else
    printWarning "No env. file specified. Using environment variables."
fi

if [[ "${action}" == "install" ]] ; then
    printMessage "Installing pre-requisite"
    printProgress "Installing azure cli"
    MTS_TEMPDIR=$(mktemp -d -t env-XXXXXXXXXX)
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
    az config set extension.use_dynamic_install=yes_without_prompt
    printProgress "Installing ffmpeg"
    sudo apt-get -y update
    sudo apt-get -y install ffmpeg
    sudo apt-get -y install  jq
    sudo apt-get -y install  dig
    printProgress "Installing .Net 6.0 SDK "
    wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -O "${MTS_TEMPDIR}"/packages-microsoft-prod.deb
    sudo dpkg -i "${MTS_TEMPDIR}"/packages-microsoft-prod.deb
    sudo apt-get update 
    sudo apt-get install -y apt-transport-https 
    sudo apt-get install -y dotnet-sdk-6.0
    printProgress "Installing Typescript and node services "
    npm install -g typescript
    tsc --version
    npm install -g webpack
    npm i --save-dev @types/jquery
    npm install -g http-server
    npm install -g forever
    printMessage "Installing pre-requisites done"
    exit 0
fi
if [[ "${action}" == "login" ]] ; then
    printMessage "Login..."
    azLogin
    checkLoginAndSubscription
    printMessage "Login done"
    exit 0
fi

if [[ "${action}" == "deploy" ]] ; then
    printMessage "Deploying the infrastructure..."
    # Check Azure connection
    printProgress "Check Azure connection for subscription: '$AZURE_SUBSCRIPTION_ID'"
    azLogin
    checkError

    # Deploy infrastructure image
    printMessage "Deploy infrastructure subscription: '$AZURE_SUBSCRIPTION_ID' region: '$AZURE_REGION' prefix: '$AZURE_APP_PREFIX' sku: 'B2' No Cosmos"
    deployAzureInfrastructure $AZURE_SUBSCRIPTION_ID $AZURE_REGION $AZURE_APP_PREFIX "B2" "0"
    printMessage "Azure Container Registry DNS name: ${ACR_LOGIN_SERVER}"
    printMessage "Azure Web App Url: ${WEB_APP_SERVER}"
    printMessage "Azure function Url: ${FUNCTION_SERVER}"
    printMessage "Cosmos DB Service: ${COSMOS_DB_SERVICE_NAME}"
    printMessage "Storage Account Name: ${STORAGE_ACCOUNT_NAME}"

    printMessage "Deploying the infrastructure done"
    exit 0
fi

if [[ "${action}" == "deploycosmos" ]] ; then
    printMessage "Deploying the infrastructure with Cosmos..."
    # Check Azure connection
    printProgress "Check Azure connection for subscription: '$AZURE_SUBSCRIPTION_ID'"
    azLogin
    checkError

    # Deploy infrastructure image
    printMessage "Deploy infrastructure subscription: '$AZURE_SUBSCRIPTION_ID' region: '$AZURE_REGION' prefix: '$AZURE_APP_PREFIX' sku: 'B2' with Cosmos"
    deployAzureInfrastructure $AZURE_SUBSCRIPTION_ID $AZURE_REGION $AZURE_APP_PREFIX "B2" "1"
    printMessage "Azure Container Registry DNS name: ${ACR_LOGIN_SERVER}"
    printMessage "Azure Web App Url: ${WEB_APP_SERVER}"
    printMessage "Azure function Url: ${FUNCTION_SERVER}"
    printMessage "Cosmos DB Service: ${COSMOS_DB_SERVICE_NAME}"
    printMessage "Storage Account Name: ${STORAGE_ACCOUNT_NAME}"

    printMessage "Deploying the infrastructure done"
    exit 0
fi

if [[ "${action}" == "undeploy" ]] ; then
    printMessage "Undeploying the infrastructure..."
    # Check Azure connection
    printProgress "Check Azure connection for subscription: '$AZURE_SUBSCRIPTION_ID'"
    azLogin
    checkError
    undeployAzureInfrastructure $AZURE_SUBSCRIPTION_ID $AZURE_APP_PREFIX

    printMessage "Undeploying the infrastructure done"
    exit 0
fi

if [[ "${action}" == "deploycontainer" ]] ; then
    printMessage "Deploying the containers in the infrastructure..."

    # Check Azure connection
    printProgress "Check Azure connection for subscription: '$AZURE_SUBSCRIPTION_ID'"
    azLogin
    checkError

    # Read the environnment variables
    getDeploymentVariables "${AZURE_APP_PREFIX}"

    # get latest image version
    latest_dotnet_version=$(getLatestImageVersion "${ACR_NAME}" "be-dotnet-web-api")
    if [ -z "${latest_dotnet_version}" ]; then
        latest_dotnet_version=$APP_VERSION
    fi
    printProgress "Latest version to deploy: '$latest_dotnet_version'"

    # deploy be-dotnet-web-api
    printProgress "Deploy image be-dotnet-web-api:${latest_dotnet_version} from Azure Container Registry ${ACR_LOGIN_SERVER}"
    deployWebAppContainer "$AZURE_SUBSCRIPTION_ID" "$AZURE_APP_PREFIX" "functionapp" "$FUNCTION_NAME" "${ACR_LOGIN_SERVER}" "${ACR_NAME}"  "be-dotnet-web-api" "latest" "${latest_dotnet_version}" "${APP_PORT}"
    
    printProgress "Checking role assignment 'Storage Table Data Contributor' between '${FUNCTION_NAME}' and Storage '${STORAGE_ACCOUNT_NAME}' "  
    resourcegroup="rg${AZURE_APP_PREFIX}"
    WebAppMsiPrincipalId=$(az functionapp show -n "${FUNCTION_NAME}" -g "${resourcegroup}" -o json | jq -r .identity.principalId)
    WebAppMsiAcrPullAssignmentCount=$(az role assignment list --assignee "${WebAppMsiPrincipalId}" --scope /subscriptions/"${AZURE_SUBSCRIPTION_ID}"/resourceGroups/"${resourcegroup}"/providers/Microsoft.Storage/storageAccounts/"${STORAGE_ACCOUNT_NAME}" | jq -r 'select(.[].roleDefinitionName=="Storage Table Data Contributor") | length')

    if [ "$WebAppMsiAcrPullAssignmentCount" != "1" ];
    then
        printProgress  "Assigning 'Storage Table Data Contributor' role assignment on scope ${STORAGE_ACCOUNT_NAME}..."
        az role assignment create --assignee-object-id "$WebAppMsiPrincipalId" --assignee-principal-type ServicePrincipal --scope /subscriptions/"${SUBSCRIPTION_ID}"/resourceGroups/"${resourcegroup}"/providers/Microsoft.Storage/storageAccounts/"${STORAGE_ACCOUNT_NAME}" --role "Storage Table Data Contributor"
    fi


    # get latest image version
    latest_webapp_version=$(getLatestImageVersion "${ACR_NAME}" "fe-ts-web-app")
    if [ -z "${latest_webapp_version}" ]; then
        latest_webapp_version=$APP_VERSION
    fi

    # deploy fe-ts-web-app
    printProgress "Deploy image fe-ts-web-app:${latest_webapp_version} from Azure Container Registry ${ACR_LOGIN_SERVER}"
    deployWebAppContainer "$AZURE_SUBSCRIPTION_ID" "$AZURE_APP_PREFIX" "webapp" "$WEB_APP_NAME" "${ACR_LOGIN_SERVER}" "${ACR_NAME}"  "fe-ts-web-app" "latest" "${latest_webapp_version}" "${APP_PORT}"

    #printProgress "Checking role assignment 'Storage Blob Data Contributor' between '${WEB_APP_NAME}' and Storage '${STORAGE_ACCOUNT_NAME}' "  
    #resourcegroup="rg${AZURE_APP_PREFIX}"
    #WebAppMsiPrincipalId=$(az webapp show -n "${WEB_APP_NAME}" -g "${resourcegroup}" -o json | jq -r .identity.principalId)
    #WebAppMsiAcrPullAssignmentCount=$(az role assignment list --assignee "${WebAppMsiPrincipalId}" --scope /subscriptions/"${AZURE_SUBSCRIPTION_ID}"/resourceGroups/"${resourcegroup}"/providers/Microsoft.Storage/storageAccounts/"${STORAGE_ACCOUNT_NAME}" | jq -r 'select(.[].roleDefinitionName=="Storage Blob Data Contributor") | length')

    #if [ "$WebAppMsiAcrPullAssignmentCount" != "1" ];
    #then
    #    printProgress  "Assigning 'Storage Blob Data Contributor' role assignment on scope ${STORAGE_ACCOUNT_NAME}..."
    #    az role assignment create --assignee-object-id "$WebAppMsiPrincipalId" --assignee-principal-type ServicePrincipal --scope /subscriptions/"${SUBSCRIPTION_ID}"/resourceGroups/"${resourcegroup}"/providers/Microsoft.Storage/storageAccounts/"${STORAGE_ACCOUNT_NAME}" --role "Storage Blob Data Contributor"
    #fi

    printProgress "Checking role assignment 'Storage Blob Data Contributor' between current user and Storage '${STORAGE_ACCOUNT_NAME}' "  
    resourcegroup="rg${AZURE_APP_PREFIX}"
    
    WebAppMsiPrincipalId=$(az ad signed-in-user show --query objectId --output tsv )
    WebAppMsiAcrPullAssignmentCount=$(az role assignment list --assignee "${WebAppMsiPrincipalId}" --scope /subscriptions/"${AZURE_SUBSCRIPTION_ID}"/resourceGroups/"${resourcegroup}"/providers/Microsoft.Storage/storageAccounts/"${STORAGE_ACCOUNT_NAME}" | jq -r 'select(.[].roleDefinitionName=="Storage Blob Data Contributor") | length')

    if [ "$WebAppMsiAcrPullAssignmentCount" != "1" ];
    then
        printProgress  "Assigning 'Storage Blob Data Contributor' role assignment on scope ${STORAGE_ACCOUNT_NAME}..."
        az role assignment create --assignee-object-id "$WebAppMsiPrincipalId" --assignee-principal-type User --scope /subscriptions/"${SUBSCRIPTION_ID}"/resourceGroups/"${resourcegroup}"/providers/Microsoft.Storage/storageAccounts/"${STORAGE_ACCOUNT_NAME}" --role "Storage Blob Data Contributor"
    fi

    # Test services
    # Test be-dotnet-web-api
    dotnet_rest_api_url="https://${FUNCTION_SERVER}/version"
    printProgress "Testing be-dotnet-web-api url: $dotnet_rest_api_url expected version: ${latest_dotnet_version}"
    result=$(checkWebUrl "${dotnet_rest_api_url}" "${latest_dotnet_version}" 420)
    if [[ $result != "true" ]]; then
        printError "Error while testing be-dotnet-web-api"
    else
        printMessage "Testing be-dotnet-web-api successful"
    fi
    # Test web-app
    node_web_app_url="https://${WEB_APP_SERVER}/config.json"
    printProgress "Testing node_web_app_url url: $node_web_app_url expected version: ${latest_webapp_version}"
    result=$(checkWebUrl "${node_web_app_url}" "${latest_webapp_version}" 420)
    if [[ $result != "true" ]]; then
        printError "Error while testing node_web_app_url"
    else
        printMessage "Testing node_web_app_url successful"
    fi

    printMessage "Deploying the containers in the infrastructure done"
    exit 0
fi

if [[ "${action}" == "buildcontainer" ]] ; then
    printMessage "Building the containers..."
    # Check Azure connection
    printProgress "Check Azure connection for subscription: '$AZURE_SUBSCRIPTION_ID'"
    azLogin
    checkError

    # Read the environnment variables
    getDeploymentVariables "${AZURE_APP_PREFIX}"
    # Create or update application
    echo "Check if Application 'sp-${AZURE_APP_PREFIX}-app' exists"
    cmd="az ad app list --query \"[?displayName=='sp-${AZURE_APP_PREFIX}-app'].appId\" --output tsv"
    printProgress "$cmd"
    appId=$(eval "$cmd") || true    
    if [[ -z ${appId} ]] ; then
        # Create application 
        #cmd="az ad app create --reply-urls  \"https://webapp${AZURE_APP_PREFIX}.azurewebsites.net/\"   --oauth2-allow-implicit-flow \"true\" --display-name \"sp-${AZURE_APP_PREFIX}-app\" --required-resource-access \"[{\\\"resourceAppId\\\": \\\"00000003-0000-0000-c000-000000000000\\\",\\\"resourceAccess\\\": [{\\\"id\\\": \\\"e1fe6dd8-ba31-4d61-89e7-88639da4683d\\\",\\\"type\\\": \\\"Scope\\\"}]},{\\\"resourceAppId\\\": \\\"e406a681-f3d4-42a8-90b6-c2b029497af1\\\",\\\"resourceAccess\\\": [{\\\"id\\\": \\\"03e0da56-190b-40ad-a80c-ea378c433f7f\\\",\\\"type\\\": \\\"Scope\\\"}]}]\" | jq -r \".appId\" "
        cmd="az ad app create --oauth2-allow-implicit-flow \"true\" --display-name \"sp-${AZURE_APP_PREFIX}-app\" --required-resource-access \"[{\\\"resourceAppId\\\": \\\"00000003-0000-0000-c000-000000000000\\\",\\\"resourceAccess\\\": [{\\\"id\\\": \\\"e1fe6dd8-ba31-4d61-89e7-88639da4683d\\\",\\\"type\\\": \\\"Scope\\\"}]},{\\\"resourceAppId\\\": \\\"e406a681-f3d4-42a8-90b6-c2b029497af1\\\",\\\"resourceAccess\\\": [{\\\"id\\\": \\\"03e0da56-190b-40ad-a80c-ea378c433f7f\\\",\\\"type\\\": \\\"Scope\\\"}]}]\" | jq -r \".appId\" "
        printProgress "$cmd"
        appId=$(eval "$cmd")  
        # Get application objectId  
        cmd="az ad app list --query \"[?displayName=='sp-${AZURE_APP_PREFIX}-app'].objectId\" --output tsv"
        printProgress "$cmd"
        objectId=$(eval "$cmd") || true    
        if [[ ! -z ${objectId} ]] ; then
            cmd="az rest --method PATCH --uri \"https://graph.microsoft.com/v1.0/applications/$objectId\" \
                --headers \"Content-Type=application/json\" \
                --body \"{\\\"spa\\\":{\\\"redirectUris\\\":[\\\"https://webapp${AZURE_APP_PREFIX}.azurewebsites.net/\\\"]},\\\"identifierUris\\\":[\\\"api://${appId}\\\"]}\""
            printProgress "$cmd"
            eval "$cmd" 
        else
            printError "Error while creating application sp-${AZURE_APP_PREFIX}-app can't get objectId"
            exit 1
        fi
    fi
    echo "Application Id: ${appId} for name: 'sp-${AZURE_APP_PREFIX}-app'"
    # Build dotnet-api docker image
    echo "Update file: ./src/be-dotnet-web-api/appsettings.json"
    cmd="cat ./src/be-dotnet-web-api/appsettings.json  | jq -r '.AzureAd.ClientId = \"${appId}\"' > tmp.$$.json && mv tmp.$$.json ./src/be-dotnet-web-api/appsettings.json"
    eval "$cmd"    
    cmd="cat ./src/be-dotnet-web-api/appsettings.Development.json  | jq -r '.AzureAd.ClientId = \"${appId}\"' > tmp.$$.json && mv tmp.$$.json ./src/be-dotnet-web-api/appsettings.Development.json"
    eval "$cmd"    
    cmd="cat ./src/be-dotnet-web-api/appsettings.json  | jq -r '.AzureAd.TenantId = \"${AZURE_TENANT_ID}\"' > tmp.$$.json && mv tmp.$$.json ./src/be-dotnet-web-api/appsettings.json"
    eval "$cmd"    
    cmd="cat ./src/be-dotnet-web-api/appsettings.Development.json  | jq -r '.AzureAd.TenantId = \"${AZURE_TENANT_ID}\"' > tmp.$$.json && mv tmp.$$.json ./src/be-dotnet-web-api/appsettings.Development.json"
    eval "$cmd"    
    cmd="cat ./src/be-dotnet-web-api/appsettings.json  | jq -r '.StorageAccount = \"${STORAGE_ACCOUNT_NAME}\"' > tmp.$$.json && mv tmp.$$.json ./src/be-dotnet-web-api/appsettings.json"
    eval "$cmd"    
    cmd="cat ./src/be-dotnet-web-api/appsettings.Development.json  | jq -r '.StorageAccount = \"${STORAGE_ACCOUNT_NAME}\"' > tmp.$$.json && mv tmp.$$.json ./src/be-dotnet-web-api/appsettings.Development.json"
    eval "$cmd"    

    # Build dotnet-api docker image
    printMessage "Building dotnet-rest-api container version:${APP_VERSION} port: ${APP_PORT}"
    buildWebAppContainer "${ACR_LOGIN_SERVER}" "./src/be-dotnet-web-api" "be-dotnet-web-api" "${APP_VERSION}" "latest" ${APP_PORT}

    printMessage "Building fe-ts-web-app container version:${APP_VERSION} port: ${APP_PORT}"
    # Update version in HTML package
    echo "Update file: ./src/fe-ts-web-app/src/config.json"
    cmd="cat ./src/fe-ts-web-app/src/config.json  | jq -r '.version = \"${APP_VERSION}\"' > tmp.$$.json && mv tmp.$$.json ./src/fe-ts-web-app/src/config.json"
    eval "$cmd"    
    cmd="cat ./src/fe-ts-web-app/src/config.json  | jq -r '.clientId = \"${appId}\"' > tmp.$$.json && mv tmp.$$.json ./src/fe-ts-web-app/src/config.json"
    eval "$cmd"   

    cmd="cat ./src/fe-ts-web-app/src/config.json  | jq -r '.tokenAPIRequest.scopes = [\"api://${appId}/user_impersonation\" ]' > tmp.$$.json && mv tmp.$$.json ./src/fe-ts-web-app/src/config.json"
    eval "$cmd"   

    cmd="cat ./src/fe-ts-web-app/src/config.json  | jq -r '.authority = \"https://login.microsoftonline.com/${AZURE_TENANT_ID}\"' > tmp.$$.json && mv tmp.$$.json ./src/fe-ts-web-app/src/config.json"
    eval "$cmd"    
    cmd="cat ./src/fe-ts-web-app/src/config.json  | jq -r '.tenantId = \"${AZURE_TENANT_ID}\"' > tmp.$$.json && mv tmp.$$.json ./src/fe-ts-web-app/src/config.json"
    eval "$cmd"    
    cmd="cat ./src/fe-ts-web-app/src/config.json  | jq -r '.redirectUri = \"https://${WEB_APP_SERVER}/\"' > tmp.$$.json && mv tmp.$$.json ./src/fe-ts-web-app/src/config.json"
    eval "$cmd"    
    cmd="cat ./src/fe-ts-web-app/src/config.json  | jq -r '.storageAccountName = \"${STORAGE_ACCOUNT_NAME}\"' > tmp.$$.json && mv tmp.$$.json ./src/fe-ts-web-app/src/config.json"
    eval "$cmd"    
    cmd="cat ./src/fe-ts-web-app/src/config.json  | jq -r '.storageContainerName = \"${STORAGE_ACCOUNT_INPUT_CONTAINER}\"' > tmp.$$.json && mv tmp.$$.json ./src/fe-ts-web-app/src/config.json"
    eval "$cmd"    
    cmd="cat ./src/fe-ts-web-app/src/config.json  | jq -r '.storageSASToken = \"\"' > tmp.$$.json && mv tmp.$$.json ./src/fe-ts-web-app/src/config.json"
    eval "$cmd"    
    cmd="cat ./src/fe-ts-web-app/src/config.json  | jq -r '.apiEndpoint = \"https://${FUNCTION_SERVER}/\"' > tmp.$$.json && mv tmp.$$.json ./src/fe-ts-web-app/src/config.json"
    eval "$cmd"    
    # build web app
    pushd ./src/fe-ts-web-app
    npm install
    tsc --build tsconfig.json
    webpack --config webpack.config.min.js
    popd    
    buildWebAppContainer "${ACR_LOGIN_SERVER}" "./src/fe-ts-web-app" "fe-ts-web-app" "${APP_VERSION}" "latest" ${APP_PORT}
    checkError    
    printMessage "Building the containers done"
    exit 0
fi

if [[ "${action}" == "integration" ]] ; then
    printMessage "Testing all the services deployed..."
    printMessage "Testing all the services done"
    exit 0
fi
