import { default as config } from "./config.json";


type CacheLocation = "localStorage" | "sessionStorage";

type AppAuthOptions = {
    clientId: string;
    authority: string;
    redirectUri: string;
};
type AppCacheOptions = {
    cacheLocation: CacheLocation;
    storeAuthStateInCookie: boolean;
};
type AppMSAuthConfig = {
    auth: AppAuthOptions;
    cache: AppCacheOptions;
};
type LoginRequest = {
    scopes: Array<string>;
};
type TokenRequest = {
    scopes: Array<string>;
};

type AppGlobalConfig = {
    version: string;
    msAuthConfig: AppMSAuthConfig;
    loginRequest: LoginRequest;
    tokenStorageRequest: TokenRequest;
    tokenAPIRequest: TokenRequest;
    graphMeEndpoint: string;
    graphMailEndpoint: string;
    tenantId: string;
    storageAccountName: string;
    storageContainerName: string;
    storageSASToken: string;
    apiEndpoint: string;
    apiGridwichEndpoint: string;
    logLevel: string;
    todoFolder: string;
    todoExtensions: Array<string>;
};

declare global {
    var globalConfiguration: AppGlobalConfig;
}
declare var globalConfiguration: AppGlobalConfig;
globalThis.globalConfiguration = {
    version: config.version,
    msAuthConfig: {
        auth: {
            clientId: config.clientId,
            authority: config.authority,
            redirectUri: config.redirectUri,
        },
        cache: {
            cacheLocation: "sessionStorage", // This configures where your cache will be stored
            storeAuthStateInCookie: config.storeAuthStateInCookie, // Set this to "true" if you are having issues on IE11 or Edge
        }
    },
    loginRequest: config.loginRequest,
    tokenStorageRequest: config.tokenStorageRequest,
    tokenAPIRequest: config.tokenAPIRequest,
    graphMeEndpoint: config.graphMeEndpoint,
    graphMailEndpoint: config.graphMailEndpoint,
    tenantId: config.tenantId,
    storageAccountName: config.storageAccountName,
    storageContainerName: config.storageContainerName,
    storageSASToken: config.storageSASToken,
    apiEndpoint: config.apiEndpoint,
    apiGridwichEndpoint: config.apiGridwichEndpoint,
    logLevel: config.logLevel,
    todoFolder: config.todoFolder,
    todoExtensions: config.todoExtensions,
};
export { };