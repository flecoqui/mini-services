
import { isNullOrUndefinedOrEmpty } from "./common";
import { AzureADClient } from "./azuread";
import { LogClient } from "./logclient";
import { resolveModuleName } from "typescript";
export class Error {
  code: number = 0;
  message: string | null = "";
  source: string | null = "";
  creationDate: string = "";
}
export class Status {
  status: number = 0;
  startDate: string = "";
  endDate: string = "";
}
export class ToDo {
  id: string = "";
  name: string | null = "";
  uri: string | null = "";
  creationDate: string = "";
  error: Error | null = null;
  status: Status | null = null;
}

export class APIClient {
  adClient: AzureADClient;
  logClient: LogClient;
  endpointUri: string;
  redirectUri: string
  constructor(logClient: LogClient, adClient: AzureADClient, endpointUri: string, redirectUri: string) {
    this.logClient = logClient;
    this.adClient = adClient;
    this.endpointUri = endpointUri;
    this.redirectUri = redirectUri;
  }
  protected callAPIAsync(method: string, endpoint: string, token: string, payload: string | null): Promise<Response> {
    return new Promise<Response>(async (resolve, reject) => {

      try {
        const headers = new Headers();
        const bearer = `Bearer ${token}`;

        headers.append("Authorization", bearer);
        if (!isNullOrUndefinedOrEmpty(this.redirectUri)) {
          let url = this.redirectUri;
          const last = url.charAt(url.length - 1);
          if (last == '/') {
            url = url.substring(0, url.length - 1);
          }
          headers.append("Access-Control-Allow-Origin", url);
        }
        headers.append("Content-Type", "application/json");

        var options;
        if (method == "GET") {
          options = {
            method: method,
            headers: headers,
          };
        }
        else if (method == "POST") {
          options = {
            method: method,
            headers: headers,
            body: JSON.stringify(payload)
          };
        }
        else if (method == "PUT") {
          options = {
            method: method,
            headers: headers,
            body: JSON.stringify(payload)
          };
        }
        else if (method == "DELETE") {
          options = {
            method: method,
            headers: headers,
          };
        }
        var response = await fetch(endpoint, options);
        if (response)
          resolve(response)
      }
      catch (error) {
        this.logClient.error(error);
        reject(error);
      }
      //fetch(endpoint, options)
      //  .then(response => resolve(response))
      //  .catch(error => {this.logClient.error(error);
      //                  reject(error)})
    });
  };
  async GetVersion(): Promise<Response | null> {
    return new Promise<Response>(async (resolve, reject) => {
      try {
        let token = await this.adClient.getAPITokenAsync();
        if (!isNullOrUndefinedOrEmpty(token)) {
          var response = await this.callAPIAsync("GET", this.endpointUri.concat('version'), token, null);
          this.logClient.log(`Calling API GET Time: response received`);
          resolve(response);
        }
        else {
          var error = `Calling API GET Version : token null`;
          this.logClient.log(error);
          reject(error);
        }
      }
      catch (e) {
        var error = `Calling API GET Version: Exception - ${e}`;
        this.logClient.log(error);
        reject(error);
      }
      return null;
    });
  }
  async GetTime(): Promise<Response | null> {
    return new Promise<Response>(async (resolve, reject) => {
      try {
        let token = await this.adClient.getAPITokenAsync();
        if (!isNullOrUndefinedOrEmpty(token)) {
          var response = await this.callAPIAsync("GET", this.endpointUri.concat('time'), token, null);
          this.logClient.log(`Calling API GET Time: response received`);
          resolve(response);
        }
        else {
          var error = `Calling API GET Time : token null`;
          this.logClient.log(error);
          reject(error);
        }
      }
      catch (e) {
        var error = `Calling API GET Time: Exception - ${e}`;
        this.logClient.log(error);
        reject(error);
      }
    });
  }
  /* Generic API

  */
  GetItems(api: string): Promise<Response | null> {
    return new Promise<Response>(async (resolve, reject) => {
      try {
        this.logClient.log(`Calling API GET ${api}s`);
        let token = await this.adClient.getAPITokenAsync();
        if (!isNullOrUndefinedOrEmpty(token)) {
          var response = await this.callAPIAsync("GET", this.endpointUri.concat(api), token, null);
          this.logClient.log(`Calling API GET ${api}s: response received`);
          resolve(response);
        }
        else {
          this.logClient.log(`Calling API GET ${api}s : token null`);
          reject("token is null");
        }
      }
      catch (e) {
        this.logClient.log(`Calling API GET ${api}s: Exception - ${e}`);
        reject(e);
      }
      return null;
    });
  }
  GetItem(api: string, id: string): Promise<Response> {
    return new Promise<Response>(async (resolve, reject) => {
      try {
        this.logClient.log(`Calling API GET ${api} ${id}`);
        let token = await this.adClient.getAPITokenAsync();
        if (!isNullOrUndefinedOrEmpty(token)) {
          var response = await this.callAPIAsync("GET", this.endpointUri.concat(api + '/' + id), token, null);
          this.logClient.log(`Calling API GET ${api} ${id} response received`);
          resolve(response);
        }
        else {
          this.logClient.log(`Calling API GET ${api} ${id} : token null`);
          reject("token is null");
        }
      }
      catch (e) {
        this.logClient.log(`Calling API GET ${api} ${id}: Exception - ${e}`);
        reject(e);
      }
      return null;
    });
  }
  DeleteItem(api: string, id: string): Promise<Response | null> {
    return new Promise<Response>(async (resolve, reject) => {
      try {
        this.logClient.log(`Calling API DELETE ${api} ${id}`);
        let token = await this.adClient.getAPITokenAsync();
        if (!isNullOrUndefinedOrEmpty(token)) {
          var response = await this.callAPIAsync("DELETE", this.endpointUri.concat(api + '/' + id), token, null);
          this.logClient.log(`Calling API DELETE ${api} ${id} response received`);
          resolve(response);
        }
        else {
          this.logClient.log(`Calling API DELETE ${api} ${id} : token null`);
          reject("token is null");
        }
      }
      catch (e) {
        this.logClient.log(`Calling API DELETE ${api} ${id}: Exception - ${e}`);
        reject(e);
      }
      return null;
    });
  }
  async UpdateItem(api: string, id: string, payload: any): Promise<Response | null> {
    return new Promise<Response>(async (resolve, reject) => {
      try {
        this.logClient.log(`Calling API PUT ${api} ${id}`);
        let token = await this.adClient.getAPITokenAsync();
        if (!isNullOrUndefinedOrEmpty(token)) {
          var response = await this.callAPIAsync("PUT", this.endpointUri.concat(api + '/' + id), token, payload);
          this.logClient.log(`Calling API PUT ${api} ${id} response received`);
          resolve(response);
        }
        else {
          this.logClient.log(`Calling API PUT ${api} ${id} : token null`);
          reject("token is null");
        }
      }
      catch (e) {
        this.logClient.log(`Calling API PUT ${api} ${id}: Exception - ${e}`);
        reject(e);
      }
      return null;
    });
  }
  async CreateItem(api: string, id: string, payload: any): Promise<Response | null> {
    return new Promise<Response>(async (resolve, reject) => {
      try {
        this.logClient.log(`Calling API POST ${api} ${id}`);
        let token = await this.adClient.getAPITokenAsync();
        if (!isNullOrUndefinedOrEmpty(token)) {
          var response = await this.callAPIAsync("POST", this.endpointUri.concat(api), token, payload);
          this.logClient.log(`Calling API POST ${api} ${id} response received`);
          resolve(response);
        }
        else {
          this.logClient.log(`Calling API POST ${api} ${id} : token null`);
          reject("token is null");
        }
      }
      catch (e) {
        this.logClient.log(`Calling API POST ${api} ${id}: Exception - ${e}`);
        reject(e);
      }
      return null;
    });
  }







  /* ToDo API

  */
  async GetToDos(): Promise<Response | null> {
    return this.GetItems("todo");
  }

  async CreateToDo(id: string, payload: any): Promise<Response | null> {
    return this.CreateItem("todo", id, payload);
  }

  async UpdateToDo(id: string, payload: any): Promise<Response | null> {
    return this.UpdateItem("todo", id, payload);
  }

  async DeleteToDo(id: string): Promise<Response | null> {
    return this.DeleteItem("todo", id);
  }

  async GetToDo(id: string): Promise<Response | null> {
    return this.GetItem("todo", id);
  }

}