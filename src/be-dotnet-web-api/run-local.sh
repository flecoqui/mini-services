#!/bin/bash
set -e
PORT=7000
export PORT_HTTP=${PORT}
export APP_VERSION=$(date +"%Y%M%d.%H%M%S")
echo "PORT_HTTP $PORT_HTTP"
echo "APP_VERSION $APP_VERSION"
ASPNETCORE_URLS="http://0.0.0.0:${PORT_HTTP}"
echo "ASPNETCORE_URLS $ASPNETCORE_URLS"
dotnet run --urls="${ASPNETCORE_URLS}"
