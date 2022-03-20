import * as MSAuth from '@azure/msal-browser';
import { isNullOrUndefinedOrEmpty } from './common';
import { LogClient } from './logclient';

type CacheLocation = "localStorage" | "sessionStorage";

type AppAuthOptions = {
  clientId: string;
  authority?: string;
  redirectUri?: string;
};
type AppCacheOptions = {
  cacheLocation?: CacheLocation;
  storeAuthStateInCookie?: boolean;
};
type AppMSAuthConfig = {
  auth: AppAuthOptions;
  cache?: AppCacheOptions;
};
type LoginRequest = {
  scopes: Array<string>;
};
type TokenRequest = {
  scopes: Array<string>;
};
type AuthResponse = {
  accessToken: string;
};

export class AzureADClient {
  //MSAuthClient: MSAuth.UserAgentApplication;
  logClient: LogClient;
  MSAuthClient: MSAuth.PublicClientApplication
  loginRequest: LoginRequest;
  tokenStorageRequest: TokenRequest;
  tokenAPIRequest: TokenRequest;
  graphMeEndpoint: string;
  graphMailEndpoint: string;

  constructor(
    logClient: LogClient,
    clientId: string,
    authority: string,
    redirectUri: string,
    cacheLocation: string,
    storeAuthStateInCookie: boolean,
    loginRequest: LoginRequest,
    tokenStorageRequest: TokenRequest,
    tokenAPIRequest: TokenRequest,
    graphMeEndpoint: string,
    graphMailEndpoint: string
  ) {
    this.logClient = logClient;
    let msAuthConfig: AppMSAuthConfig = {
      auth: {
        clientId: clientId,
        authority: authority,
        redirectUri: redirectUri,
      },
      cache: {
        cacheLocation: (cacheLocation == "localStorage" ? "localStorage" : "sessionStorage"), // This configures where your cache will be stored
        storeAuthStateInCookie: storeAuthStateInCookie, // Set this to "true" if you are having issues on IE11 or Edge
      }
    }
    this.loginRequest = loginRequest;
    this.tokenStorageRequest = tokenStorageRequest;
    this.tokenAPIRequest = tokenAPIRequest;
    this.graphMeEndpoint = graphMeEndpoint;
    this.graphMailEndpoint = graphMailEndpoint;

    //this.MSAuthClient = new MSAuth.UserAgentApplication(msAuthConfig);
    this.MSAuthClient = new MSAuth.PublicClientApplication(msAuthConfig);
  };

  getAccount(): MSAuth.AccountInfo | null {
    let currentAccounts = [];
    try {
      // In case multiple accounts exist, you can select
      currentAccounts = this.MSAuthClient.getAllAccounts();
      if (currentAccounts === null) {
        // no accounts detected
      } else if (currentAccounts.length >= 1) {
        return currentAccounts[0];
      }
    }
    catch (err) {
      this.logClient.error(err);
    }
    return null;
  }

  setAccount(account: MSAuth.AccountInfo): boolean {
    try {
      this.MSAuthClient.setActiveAccount(account);
      return true;
    }
    catch (err) {
      this.logClient.error(err);
    }
    return false;
  }

  /*
  async signInAsync (): Promise<MSAuth.AccountInfo|null> {
    const p = new Promise<any>(resolve => this.signIn(resolve));
    const result = await p;
    return result;
  };
*/
  signInAsync(): Promise<MSAuth.AccountInfo | null> {
    return new Promise<MSAuth.AccountInfo | null>((resolve, reject) => {
      this.logClient.log("Login interectively");
      this.MSAuthClient.loginPopup(this.loginRequest)
        .then(loginResponse => {
          var message = `id_token acquired - expireon: ${loginResponse.expiresOn} cached: ${loginResponse.fromCache} idToken: ${loginResponse.idToken} `;
          this.logClient.log(message);
          var account = this.getAccount();
          if (account)
            this.setAccount(account);
          resolve(account);
        }).catch(error => {
          this.logClient.error(error);
          reject(error)
        });
    });
  };
  /*
    signIn(resolve: any) {
      this.MSAuthClient.loginPopup(this.loginRequest)
        .then(loginResponse => {
          console.log("id_token acquired at: " + new Date().toString());
          console.log(loginResponse);
          resolve(this.getAccount());        
        }).catch(error => {
          resolve(null)
          console.log(error);
        });
    }
  */
  async signOutAsync(): Promise<void> {
    await this.MSAuthClient.logoutRedirect();
  }

  getTokenPopup(request: any): Promise<MSAuth.AuthenticationResult | void> {

    return new Promise<MSAuth.AuthenticationResult | void>(async (resolve, reject) => {
      this.logClient.log("Acquiring Token silently");
      try {
        var result: MSAuth.AuthenticationResult = await this.MSAuthClient.acquireTokenSilent(request);
        if (result) {
          this.logClient.log("Acquire Token silently successful: response received");
          resolve(result);
          return;
        }
        else {
          this.logClient.error(`Silent token acquisition fails. Response null `);
        }
      }
      catch (error) {
        this.logClient.error(`Silent token acquisition fails. Exception: ${error}. acquiring token using popup`);
      }

      this.logClient.log("Acquiring Token interactively");
      try {
        var result: MSAuth.AuthenticationResult = await this.MSAuthClient.acquireTokenPopup(request);
        if (result) {
          this.logClient.log("Acquire Token interactively successful: response received");
          resolve(result);
          return;
        }
        else {
          var error: string = "Token interactively acquisition failed: Response null";
          this.logClient.error(error);
          reject(error);
          return;
        }
      }
      catch (error) {
        var message: string = `Token interactively acquisition failed. Exception: ${error}. acquiring token using popup`;
        this.logClient.error(message);
        reject(message);
      }
    });
  }

  // Helper function to call MS Graph API endpoint 
  // using authorization bearer token scheme
  callMSGraphAsync(endpoint: string, token: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const headers = new Headers();
      const bearer = `Bearer ${token}`;

      headers.append("Authorization", bearer);

      const options = {
        method: "GET",
        headers: headers
      };

      this.logClient.log('request made to Graph API at: ' + new Date().toString());

      fetch(endpoint, options)
        .then(response => response.json())
        .then(response => resolve(response))
        .catch(error => {
          this.logClient.error(error);
          reject(error)
        })
    });
  }

  /*
  async callMSGraphAsync (endpoint: string, token: string) {
    const p = new Promise<any>(resolve => this.callMSGraph(resolve, endpoint, token));
    const result = await p;
    return result;
  };

  callMSGraph(resolve: any, endpoint: string, token: string) {
    const headers = new Headers();
    const bearer = `Bearer ${token}`;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers
    };

    console.log('request made to Graph API at: ' + new Date().toString());
    
    fetch(endpoint, options)
      .then(response => response.json())
      .then(response => resolve(response))
      .catch(error => {console.log(error);
                      resolve(null)})
  }
*/
  getStorageTokenAsync(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (this.getAccount()) {
        this.logClient.log("Get Token for Storage: account present");
        this.getTokenPopup(this.tokenStorageRequest)
          .then(async (response: any) => {
            this.logClient.log("Get Token for Storage: SUCCESS");
            resolve((<AuthResponse>response).accessToken);
          }).catch((error: any) => {
            this.logClient.log("Get Token for Storage: Exception:" + error);
            reject(error);
          });
      }
      else {
        var error = "Can't get authentication token: No active Azure AD session";
        this.logClient.log("Get Token for Storage:" + error);
        reject("Get Token for Storage:" + error);
      }
    });
  }
  /*
  async getStorageTokenAsync () {
    const p = new Promise<any>(resolve => this.getStorageToken(resolve));
    const result = await p;
    return result;
  };
  
  getStorageToken(resolve: any) {
    if (this.getAccount()) {
      this.getTokenPopup(this.tokenStorageRequest)
        .then(async (response: any) => {
          resolve((<AuthResponse> response).accessToken);          
        }).catch((error:any) => {
          console.log(error);
          resolve(null);
        });
    }
  }
*/

  getAPITokenAsync(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (this.getAccount()) {
        this.logClient.log("Get Token for API: account present");
        this.getTokenPopup(this.tokenAPIRequest)
          .then(async (response: any) => {
            if (isNullOrUndefinedOrEmpty(response)) {
              var error = "Get Token for API:Response for token undefined";
              this.logClient.error(error);
              reject(error);
            }
            else {
              this.logClient.log("Get Token for API: success");
              resolve((<AuthResponse>response).accessToken);
            }
          }).catch((error: any) => {
            this.logClient.error("Get Token for API:" + error);
            reject("Get Token for API:" + error);
          });
      }
      else {
        var error = "Can't get authentication token: No active Azure AD session";
        this.logClient.error("Get Token for API:" + error);
        reject("Get Token for API:" + error);
      }
    });
  };

  /*
    async getAPITokenAsync () {
      const p = new Promise<any>(resolve => this.getAPIToken(resolve));
      const result = await p;
      return result;
    };
    
    getAPIToken(resolve: any) {
      if (this.getAccount()) {
        this.getTokenPopup(this.tokenAPIRequest)
          .then(async (response: any) => {
            resolve((<AuthResponse> response).accessToken);          
          }).catch((error:any) => {
            console.log(error);
            resolve(null);
          });
      }
    }
  */
  getGraphMeDataAsync(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (this.getAccount()) {
        this.logClient.log("Get Token for GRAPH: account present");
        this.getTokenPopup(this.loginRequest)
          .then(async (response: void | MSAuth.AuthenticationResult) => {
            if (isNullOrUndefinedOrEmpty(response)) {
              var error = "Get Token for GRAPH:Response for token undefined";
              this.logClient.error(error);
              reject(error);
            }
            else {
              this.logClient.log("Get Token for GRAPH: SUCCESS");
              let data = await this.callMSGraphAsync(this.graphMeEndpoint, (<AuthResponse>response).accessToken);
              resolve(data);
            }
          }).catch((error: any) => {
            this.logClient.error(error);
            reject(error);
          });
      }
      else {
        var error = "Get Token for GRAPH: No active Azure AD Session";
        this.logClient.log(error);
        reject(error);
      }

    });
  };

  /*
    async getGraphMeDataAsync () {
      const p = new Promise<any>(resolve => this.getGraphMeData(resolve));
      const result = await p;
      return result;
    };
    
    getGraphMeData(resolve: any) {
      if (this.getAccount()) {
        this.getTokenPopup(this.loginRequest)
          .then(async (response: any) => {
            let data = await this.callMSGraphAsync(this.graphMeEndpoint, (<AuthResponse> response).accessToken);
            resolve(data);          
          }).catch((error:any) => {
            console.log(error);
            resolve(null);
          });
      }
    }
  
  */
  getGraphMailDataAsync(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (this.getAccount()) {
        this.logClient.log("Get Token for MAIL: account present");
        this.getTokenPopup(this.tokenStorageRequest)
          .then(async (response: any) => {
            if (isNullOrUndefinedOrEmpty(response)) {
              var error = "Get Token for MAIL:Response for token undefined";
              this.logClient.error(error);
              reject(error);
            }
            else {
              var message = "Get Token for MAIL: SUCCESS";
              this.logClient.log(message);
              let data = await this.callMSGraphAsync(this.graphMailEndpoint, (<AuthResponse>response).accessToken);
              resolve(data);
            }
          }).catch((error: any) => {
            this.logClient.error("Get Token for MAIL Exception:" + error);
            reject(error);
          });
      }
      else {
        var error = "Get Token for MAIL: No active Azure AD session";
        this.logClient.error(error);
        reject(error);
      }
    });
  };

  /*
    async getGraphMailDataAsync () {
      const p = new Promise<any>(resolve => this.getGraphMailData(resolve));
      const result = await p;
      return result;
    };
  
    getGraphMailData(resolve: any) {
      if (this.getAccount()) {
        this.getTokenPopup(this.tokenStorageRequest)
          .then(async (response: any) => {
            let data = await this.callMSGraphAsync(this.graphMailEndpoint, (<AuthResponse> response).accessToken);
            resolve(data);          
          }).catch((error: any) => {
            console.log(error);
            resolve(null);
          });
      }
    }
  */
  isConnected(): boolean {
    if (isNullOrUndefinedOrEmpty(this.getAccount()))
      return false;
    return true;
  }

}
