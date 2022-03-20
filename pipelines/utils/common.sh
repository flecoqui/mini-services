#!/bin/bash
#
# executable
#

##############################################################################
# colors for formatting the ouput
##############################################################################
# shellcheck disable=SC2034
{
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[0;31m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color
}
##############################################################################
#- function used to check whether an error occured
##############################################################################
function checkError() {
    # shellcheck disable=SC2181
    if [ $? -ne 0 ]; then
        echo -e "${RED}\nAn error occured exiting from the current bash${NC}"
        exit 1
    fi
}

##############################################################################
#- print functions
##############################################################################
function printMessage(){
    echo -e "${GREEN}$1${NC}" 
}
function printWarning(){
    echo -e "${YELLOW}$1${NC}" 
}
function printError(){
    echo -e "${RED}$1${NC}" 
}
function printProgress(){
    echo -e "${BLUE}$1${NC}" 
}
##############################################################################
#- azure Login 
##############################################################################
function azLogin() {
    # Check if current process's user is logged on Azure
    # If no, then triggers az login
    if [ -z $AZURE_SUBSCRIPTION_ID ]; then
        printError "Variable AZURE_SUBSCRIPTION_ID not set"
        exit 1
    fi
    if [ -z $AZURE_TENANT_ID ]; then
        printError "Variable AZURE_TENANT_ID not set"
        exit 1
    fi
    azOk=true
    az account set -s "$AZURE_SUBSCRIPTION_ID" 2>/dev/null || azOk=false
    if [[ ${azOk} == false ]]; then
        printWarning "Need to az login"
        az login --tenant "$AZURE_TENANT_ID"
    fi

    azOk=true
    az account set -s "$AZURE_SUBSCRIPTION_ID"   || azOk=false
    if [[ ${azOk} == false ]]; then
        echo -e "unknown error"
        exit 1
    fi
}
##############################################################################
#- checkLoginAndSubscription 
##############################################################################
function checkLoginAndSubscription() {
    az account show -o none
    if [ $? -ne 0 ]; then
        echo -e "\nYou seems disconnected from Azure, running 'az login'."
        az login -o none
    fi
    CURRENT_SUBSCRIPTION_ID=$(az account show --query 'id' --output tsv)
    if [[ -z "$AZURE_SUBSCRIPTION_ID"  || "$AZURE_SUBSCRIPTION_ID" != "$CURRENT_SUBSCRIPTION_ID" ]]; then
        # query subscriptions
        echo -e "\nYou have access to the following subscriptions:"
        az account list --query '[].{name:name,"subscription Id":id}' --output table

        echo -e "\nYour current subscription is:"
        az account show --query '[name,id]'
        if [[ ${silentmode} == false || -z "$CURRENT_SUBSCRIPTION_ID" ]]; then        
            echo -e "
            You will need to use a subscription with permissions for creating service principals (owner role provides this).
            If you want to change to a different subscription, enter the name or id.
            Or just press enter to continue with the current subscription."
            read -p ">> " SUBSCRIPTION_ID

            if ! test -z "$SUBSCRIPTION_ID"
            then 
                az account set -s "$SUBSCRIPTION_ID"
                echo -e "\nNow using:"
                az account show --query '[name,id]'
                CURRENT_SUBSCRIPTION_ID=$(az account show --query 'id' --output tsv)
            fi
        fi
    fi
}
##############################################################################
#- check is Url is ready returning 200 and the expected response
##############################################################################
function checkUrl() {
    httpCode="404"
    apiUrl="$1"
    expectedResponse="$2"
    timeOut="$3"
    response=""
    count=0
    while [[ "$httpCode" != "200" ]] || [[ "$response" != "$expectedResponse" ]] && [[ $count -lt ${timeOut} ]]
    do
        SECONDS=0
        httpCode=$(curl -s -o /dev/null -L -w '%{http_code}' "$apiUrl") || true
        if [[ $httpCode == "200" ]]; then
            response=$(curl -s  "$apiUrl") || true
            response=${response//\"/}
        fi
        #echo "count=${count} code: ${httpCode} response: ${response} "
        sleep 10
        ((count=count+SECONDS))
    done
    if [ $httpCode == "200" ] && [ "${response}" == "${expectedResponse}" ]; then
        echo "true"
        return
    fi
    echo "false"
    return
}
##############################################################################
#- check is Url is ready returning 200
##############################################################################
function checkWebUrl() {
    httpCode="404"
    apiUrl="$1"
    expectedResponse="$2"
    timeOut="$3"
    response=""
    count=0
    while [[ "$httpCode" != "200" ]] || [[ ! "${response}" =~ .*"${expectedResponse}".* ]] && [[ $count -lt ${timeOut} ]]
    do
        SECONDS=0
        httpCode=$(curl -s -o /dev/null -L -w '%{http_code}' "$apiUrl") || true
        if [[ $httpCode == "200" ]]; then
            response=$(curl -s  "$apiUrl") || true
            response=${response//\"/}
        fi
        #echo "count=${count} code: ${httpCode} response: ${response} "
        sleep 10
        ((count=count+SECONDS))
    done
    #echo "httpcode: ${httpCode}"
    #echo "response: ${response}"
    #echo "expectedResponse: ${expectedResponse}"
    if [[ $httpCode == "200" ]] && [[ "${response}" =~ .*"${expectedResponse}".* ]]; then
        echo "true"
        return
    fi
    echo "false"
    return
}

##############################################################################
#- get localhost
##############################################################################
function get_local_host() {
CONTAINER_NAME="$1"
DEV_CONTAINER_ROOT="/dcworkspace"
DEV_CONTAINER_NETWORK=$(docker inspect $(hostname) | jq -r '.[0].HostConfig.NetworkMode')
FULL_PATH=$(cd $(dirname ""); pwd -P /$(basename ""))
    if [[ $FULL_PATH =~ ^$DEV_CONTAINER_ROOT.* ]] && [[ -n $DEV_CONTAINER_NETWORK ]]; then
        # running in dev container
        # connect devcontainer network to container
        if [[ $(docker container inspect "${CONTAINER_NAME}" | jq -r ".[].NetworkSettings.Networks.\"$DEV_CONTAINER_NETWORK\"") == null ]]; then 
            docker network connect ${DEV_CONTAINER_NETWORK} ${CONTAINER_NAME} 
        fi
        CONTAINER_IP=$(docker container inspect "${CONTAINER_NAME}" | jq -r ".[].NetworkSettings.Networks.\"$DEV_CONTAINER_NETWORK\".IPAddress")
        echo "$CONTAINER_IP"
    else
        echo "127.0.0.1"
    fi
}
##############################################################################
#- deployAzureInfrastructure
##############################################################################
function deployAzureInfrastructure(){
    subscription=$1
    region=$2
    prefix=$3
    sku=$4
    cosmos=$5
    datadep=$(date +"%y%m%d-%H%M%S")
    resourcegroup="rg${prefix}"
    prefix="${prefix}"

    cmd="az group create  --subscription $subscription --location $region --name $resourcegroup --output none "
    printProgress "$cmd"
    eval "$cmd"

    checkError
    if [[ $cosmos == "1" ]]; then
        cmd="az deployment group create \
            --name $datadep \
            --resource-group $resourcegroup \
            --subscription $subscription \
            --template-file $SCRIPTS_DIRECTORY/global.cosmos.json \
            --output none \
            --parameters \
            name=$prefix sku=$sku"
    else
        cmd="az deployment group create \
            --name $datadep \
            --resource-group $resourcegroup \
            --subscription $subscription \
            --template-file $SCRIPTS_DIRECTORY/global.json \
            --output none \
            --parameters \
            name=$prefix sku=$sku"
    fi    
    printProgress "$cmd"
    eval "$cmd"
    checkError
    
    # Initialize the environment variables from the infrastructure deployment
    getDeploymentVariables "$3" "${datadep}"
}
##############################################################################
#- getDeploymentVariables
##############################################################################
function getDeploymentVariables(){
    resourcegroup="rg$1"

    if [[ ! $# -ge 2 ]]; then
        datadep=$(getDeploymentName "$AZURE_SUBSCRIPTION_ID" "$resourcegroup" 'webAppServer')
    else
        if [ -z "$2" ]; then
            datadep=$(getDeploymentName "$AZURE_SUBSCRIPTION_ID" "$resourcegroup" 'webAppServer')
        else
            datadep="$2"
        fi
    fi
    printProgress "Getting variables from deployment Name: ${datadep}"
    # get ACR login server dns name
    ACR_LOGIN_SERVER=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.acrLoginServer.value')
    # get WebApp Url
    WEB_APP_NAME=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.webAppName.value')
    WEB_APP_SERVER=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.webAppServer.value')
    # get FUNCTION Url
    FUNCTION_NAME=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.functionName.value')
    FUNCTION_SERVER=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.functionServer.value')
    # get ACR Name
    ACR_NAME=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.acrName.value')
    # get WebApp Tenant ID
    WEB_APP_TENANT_ID=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.webAppTenantId.value')
    # get WebApp Object ID
    WEB_APP_OBJECT_ID=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.webAppObjectId.value')
    # get Storage Account
    STORAGE_ACCOUNT_NAME=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.storageAccountName.value')
    STORAGE_ACCOUNT_TOKEN=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.storageAccountToken.value')
    STORAGE_ACCOUNT_INPUT_CONTAINER=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.inputContainerName.value')
    STORAGE_ACCOUNT_OUTPUT_CONTAINER=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.outputContainerName.value')
    # get Cosmos DB Information
    COSMOS_DB_SERVICE_NAME=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.cosmosDBServiceName.value')
    COSMOS_DB_SERVICE_KEY=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.cosmosDBServiceKey.value')
    COSMOS_DB_NAME=$(az deployment group show --resource-group $resourcegroup -n $datadep | jq -r '.properties.outputs.cosmosDBName.value')
}
##############################################################################
#- undeployAzureInfrastructure
##############################################################################
function undeployAzureInfrastructure(){
    subscription=$1
    prefix=$2
    resourcegroup="rg${prefix}"

    cmd="az group delete  --subscription $subscription  --name $resourcegroup -y --output none "
    printProgress "$cmd"
    eval "$cmd"
}
##############################################################################
#- buildWebAppContainer
##############################################################################
function buildWebAppContainer() {
    ContainerRegistryName="$1"
    apiModule="$2"
    imageName="$3"
    imageTag="$4"
    imageLatestTag="$5"
    portHttp="$6"

    targetDirectory="$(dirname "${BASH_SOURCE[0]}")/../../$apiModule"

    if [ ! -d "$targetDirectory" ]; then
            echo "Directory '$targetDirectory' does not exist."
            exit 1
    fi

    echo "Building and uploading the docker image for '$apiModule'"

    # Navigate to API module folder
    pushd "$targetDirectory" > /dev/null

    # Build the image
    echo "Building the docker image for '$imageName:$imageTag'"
    cmd="az acr build --registry $ContainerRegistryName --image ${imageName}:${imageTag} --image ${imageName}:${imageLatestTag} -f Dockerfile --build-arg APP_VERSION=${imageTag} --build-arg ARG_PORT_HTTP=${portHttp} --build-arg ARG_APP_ENVIRONMENT="Production" . --output none"
    printProgress "$cmd"
    eval "$cmd"

    
    popd > /dev/null

}
##############################################################################
#- deployWebAppContainer
##############################################################################
function deployWebAppContainer(){
    SUBSCRIPTION_ID="$1"
    prefix="$2"
    appType="$3"
    webapp="$4"
    ContainerRegistryUrl="$5"
    ContainerRegistryName="$6"
    imageName="$7"
    imageTag="$8"
    appVersion="$9"
    portHTTP="${10}"

    resourcegroup="rg${prefix}"

    # When deployed, WebApps get automatically a managed identity. Ensuring this MSI has AcrPull rights
    printProgress  "Ensure ${webapp} has AcrPull role assignment on ${ContainerRegistryName}..."
    WebAppMsiPrincipalId=$(az ${appType} show -n "$webapp" -g "$resourcegroup" -o json | jq -r .identity.principalId)
    WebAppMsiAcrPullAssignmentCount=$(az role assignment list --assignee "$WebAppMsiPrincipalId" --scope /subscriptions/"${SUBSCRIPTION_ID}"/resourceGroups/"${resourcegroup}"/providers/Microsoft.ContainerRegistry/registries/"${ContainerRegistryName}" | jq -r 'select(.[].roleDefinitionName=="AcrPull") | length')

    if [ "$WebAppMsiAcrPullAssignmentCount" != "1" ];
    then
        printProgress  "Assigning AcrPull role assignment on scope ${ContainerRegistryName}..."
        az role assignment create --assignee-object-id "$WebAppMsiPrincipalId" --assignee-principal-type ServicePrincipal --scope /subscriptions/"${SUBSCRIPTION_ID}"/resourceGroups/"${resourcegroup}"/providers/Microsoft.ContainerRegistry/registries/"${ContainerRegistryName}" --role "AcrPull"
    fi

    printProgress  "Check if WebApp ${webapp} use Managed Identity for the access to ACR ${ContainerRegistryName}..."
    WebAppAcrConfigAcrEnabled=$(az resource show --ids /subscriptions/"${SUBSCRIPTION_ID}"/resourceGroups/"${resourcegroup}"/providers/Microsoft.Web/sites/"${webapp}"/config/web | jq -r ".properties.acrUseManagedIdentityCreds")
    if [ "$WebAppAcrConfigAcrEnabled" = false ];
    then
        printProgress "Enabling Acr on ${webapp}..."
        az resource update --ids /subscriptions/"${SUBSCRIPTION_ID}"/resourceGroups/"${resourcegroup}"/providers/Microsoft.Web/sites/"${webapp}"/config/web --set properties.acrUseManagedIdentityCreds=True
    fi


    printProgress "Create Containers"
    FX_Version="Docker|$ContainerRegistryUrl/$imageName:$imageTag"

    #Configure the ACR, Image and Tag to pull
    cmd="az resource update --ids /subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${resourcegroup}/providers/Microsoft.Web/sites/${webapp}/config/web --set properties.linuxFxVersion=\"$FX_Version\" -o none --force-string"
    printProgress "$cmd"
    eval "$cmd"

    printProgress "Create Config"
    cmd="az ${appType} config appsettings set -g "$resourcegroup" -n "$webapp" \
    --settings APP_VERSION=${appVersion} PORT_HTTP=${portHTTP} --output none"
    printProgress "$cmd"
    eval "$cmd"
}

##############################################################################
#- getDeploymentName: get latest deployment Name for resource group
#  arg 1: Azure Subscription
#  arg 2: Resource Group
#  arg 3: Output variable to support
##############################################################################
function getDeploymentName(){
    subscription="$1"
    resource_group="$2"
    output_variable="$3"
    cmd="az deployment group list -g  ${resource_group} --subscription ${subscription} --output json"
    #echo "$cmd"
    result=$(eval "$cmd")
    cmd="echo '$result' | jq -r 'length'"
    count=$(eval "$cmd")
    if [ ! -z $count ] ; then
        #echo "COUNT: $count"
        for ((index=0;index<=((${count}-1));index++ ))
        do
            cmd="echo '$result' | jq -r '.[${index}].name'"
            name=$(eval "$cmd")
            #echo "name: $name"
            cmd="az deployment group show --resource-group ${resource_group} -n ${name} --subscription ${subscription} | jq -r '.properties.outputs.${output_variable}.value'"
            value=$(eval "$cmd")
            #echo "value: $value"
            if [[ ! -z "$value" ]]; then
                if [[ "$value" != "null" ]]; then
                    echo "${name}"
                    return
                fi
            fi
        done
    fi               
}

##############################################################################
#- getLatestImageVersion: get latest image version
#  arg 1: ACR Name
#  arg 2: image Name
##############################################################################
function getLatestImageVersion(){
    acr="$1"
    image="$2"
    cmd="az acr repository show-manifests --name ${acr} --repository ${image} --output json"
    #echo "$cmd"
    result=$(eval "$cmd")
    cmd="echo '$result' | jq -r 'length'"
    count=$(eval "$cmd")
    if [ ! -z $count ] ; then
        #echo "COUNT: $count"
        for ((index=0;index<=((${count}-1));index++ ))
        do
            cmd="echo '$result' | jq -r '.[${index}].tags' | jq -r 'length' "
            count_tags=$(eval "$cmd")
            #echo "count_tags: $count_tags"
            for ((index_tag=0;index_tag<=((${count_tags}-1));index_tag++ ))
            do
                cmd="echo '$result' | jq -r '.[${index}].tags[${index_tag}]' "
                tag=$(eval "$cmd")
                if [ $tag == 'latest' ]; then
                    if [ $index_tag -ge 1 ]; then
                        cmd="echo '$result' | jq -r '.[${index}].tags[0]' "
                        version=$(eval "$cmd")
                        echo "${version}"
                        return
                    fi
                fi
            done
        done
    fi               
}
