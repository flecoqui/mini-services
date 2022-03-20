import './globalconfig';
import './globalclient';
import { LogClient } from './logclient';
import { AzureADClient } from './azuread';
import { StorageClient } from './storage';
import { APIClient } from './apiclient';
import { isNullOrUndefinedOrEmpty, isNullOrUndefined, isEmpty } from "./common";
import { Page } from "./page";
import { ButtonWaiting, PageWaiting, Progress, Alert, Toast, WaitCursorForm } from "./notificationclient";
import { UploadTable } from "./uploadTable";
class TestsPage extends Page {
  version: string;
  logClient: LogClient;
  adClient: AzureADClient;
  storageClient: StorageClient;
  apiClient: APIClient;
  apiGridwichEndpoint: string;
  storageAccountName: string;
  storageContainerName: string;
  redirectUri: string;
  uploadTable: UploadTable|null;
  constructor(id: string, name: string, uri: string | null, content: string | null, version: string, logClient: LogClient, adClient: AzureADClient, storageClient: StorageClient, apiClient: APIClient,
    apiGridwichEndpoint: string, storageAccountName: string, storageContainerName: string, redirectUri: string) {
    super(id, name, uri, content);
    this.version = version;
    this.logClient = logClient;
    this.adClient = adClient;
    this.storageClient = storageClient;
    this.apiClient = apiClient;
    this.apiGridwichEndpoint = apiGridwichEndpoint;
    this.storageAccountName = storageAccountName;
    this.storageContainerName = storageContainerName;
    this.redirectUri = redirectUri;
    this.uploadTable = new UploadTable("upload_table");

  }
  clearResultAndError(): void {
    this.setHTMLValueText("output", "");
    this.setHTMLValueText("error", "");
  }
  async signIn(ev: any): Promise<void> {
    var waiting = new ButtonWaiting("signin_btn");
    waiting.show();
    this.clearResultAndError();
    try {
      let account = await this.adClient.signInAsync();
      if (account) {
        var message: string = `SignIn successful - username: ${account.username} tenantId: ${account.tenantId} env: ${account.environment} name: ${account.name}`;
        this.logClient.log(message);
        this.setHTMLValueText("output", message);
      }
      else {
        var error = "SignIn failed - Authentication failed: account null"
        this.logClient.error(error);
        this.setHTMLValueText("error", error);
      }
    }
    catch (e) {
      var error = `Exception while calling signIn: ${e}`;
      this.logClient.error(error);
      this.setHTMLValueText("error", error);
    }
    finally {
      waiting.hide();
    }
  }

  async signOut(ev: any): Promise<void> {
    this.clearResultAndError();
    try {
      await this.adClient.signOutAsync();
      if (!this.adClient.isConnected()) {
        var message: string = "SignOut successful ";
        this.logClient.log(message);
        this.setHTMLValueText("output", message);
      }
      else {
        var error = "SignOut failed - still connected"
        this.logClient.error(error);
        this.setHTMLValueText("error", error);
      }
    }
    catch (e) {
      var error = `Exception while calling signOut: ${e}`;
      this.logClient.error(error);
      this.setHTMLValueText("error", error);
    }
  }

  isConnected(ev: any): void {
    this.clearResultAndError();
    var waiting = new ButtonWaiting("isconnected_btn");
    waiting.show();
    try {
      if (this.adClient.isConnected()) {
        var message: string = "AzureADClient connected";
        this.logClient.log(message);
        this.setHTMLValueText("output", message);
      }
      else {
        var message: string = "AzureADClient not connected";
        this.logClient.log(message);
        this.setHTMLValueText("output", message);
      }
    }
    catch (e) {
      var message: string = `Exception while callling AzureADClient.isConnected: ${e}`;
      this.logClient.error(message);
      this.setHTMLValueText("error", message);
    }
    finally {
      waiting.hide();
    }
  }
  getAccount(ev: any): void {
    this.clearResultAndError();
    var waiting = new ButtonWaiting("account_btn");        
    waiting.show(null, WaitCursorForm.grow);
    try {
      let account = this.adClient.getAccount();
      if (account) {
        var message: string = `Account information - username: ${account.username} tenantId: ${account.tenantId} env: ${account.environment} name: ${account.name}`;
        this.logClient.log(message);
        this.setHTMLValueText("output", message);
      }
      else {
        var error = "Account information not available: account null"
        this.logClient.error(error);
        this.setHTMLValueText("error", error);
      }
    }
    catch (e) {
      var error = `Exception while calling azureADClient.getAccount: ${e}`;
      this.logClient.error(error);
      this.setHTMLValueText("error", error);
    }
    finally {
      waiting.hide();
    }

  }
  async getGraphAccount(ev: any): Promise<void> {
    this.clearResultAndError();
    var waiting = new ButtonWaiting("graph_btn");        
    waiting.show(null, WaitCursorForm.grow);
    try {
      let account = await this.adClient.getGraphMeDataAsync();
      if (account) {
        var message: string = `Graph Account information - mail: ${account.mail} jobTitle: ${account.jobTitle} businessPhone: ${account.businessPhones[0]} office: ${account.officeLocation} UPN: ${account.userPrincipalName} displayName: ${account.displayName}`;
        this.logClient.log(message);
        this.setHTMLValueText("output", message);
      }
      else {
        var error = "Graph Account information not available: account null"
        this.logClient.error(error);
        this.setHTMLValueText("error", error);
      }
    }
    catch (e) {
      var error = `Exception while calling azureADClient.getGraphMeDataAsync: ${e}`;
      this.logClient.error(error);
      this.setHTMLValueText("error", error);
    }
    finally {
      waiting.hide();
    }
  }
  async getMail(ev: any): Promise<void> {
    this.clearResultAndError();
    var waiting = new ButtonWaiting("mail_btn");        
    waiting.show(null, WaitCursorForm.grow);
    try {
      let mails = await this.adClient.getGraphMailDataAsync();
      if (mails) {
        if (mails.error) {
          var error = `Graph Mail error: code: ${mails.error.code} message: ${mails.error.message}`
          this.logClient.error(error);
          this.setHTMLValueText("error", error);
        }
        else {
          var message: string = `Graph Mail: ${mails.value.length} mails in the mailbox`;
          this.logClient.log(message);
          this.setHTMLValueText("output", message);
        }
      }
      else {
        var error = "Graph Mail not available: mails null"
        this.logClient.error(error);
        this.setHTMLValueText("error", error);
      }
    }
    catch (e) {
      var error = `Exception while calling azureADClient.getGraphMailDataAsync: ${e}`;
      this.logClient.error(error);
      this.setHTMLValueText("error", error);
    }
    finally {
      waiting.hide();
    }

  }

  async getVersion(ev: any): Promise<void> {
    this.clearResultAndError();
    var waiting = new ButtonWaiting("api_getversion_btn");        
    waiting.show(null, WaitCursorForm.grow);

    try {
      let response = await this.apiClient.GetVersion();
      if (response) {
        if (response.status == 200) {
          let responseObject: any = await response.json();
          if (!isNullOrUndefinedOrEmpty(responseObject)) {
            message = responseObject.version;
            var message: string = `API Get Version - version: ${message}`;
            this.logClient.log(message);
            this.setHTMLValueText("output", message);
          }
          else {
            var message: string = `API Get Version - error: can't parse response object ${response}`;
            this.logClient.error(message);
            this.setHTMLValueText("error", message);
          }
        }
        else {
          var message: string = `API Get Version - error: unexpected response from server: status = ${response.status}`;
          this.logClient.error(message);
          this.setHTMLValueText("error", message);
        }
      }
      else {
        var error = "API Get Version - error : response null"
        this.logClient.error(error);
        this.setHTMLValueText("error", error);
      }
    }
    catch (e) {
      var error = `Exception while calling API Get Version: ${e}`;
      this.logClient.error(error);
      this.setHTMLValueText("error", error);
    }
    finally {
      waiting.hide();
    }
  }
  async getTime(ev: any): Promise<void> {
    this.clearResultAndError();
    var waiting = new ButtonWaiting("api_gettime_btn");        
    waiting.show(null, WaitCursorForm.grow);

    try {
      let response = await this.apiClient.GetTime();
      if (response) {
        if (response.status == 200) {
          let responseObject: any = await response.json();
          if (!isNullOrUndefinedOrEmpty(responseObject)) {
            message = responseObject.time;
            var message: string = `API Get Time - time: ${message}`;
            this.logClient.log(message);
            this.setHTMLValueText("output",  message);
          }
          else {
            var message: string = `API Get Time - error: can't parse response object ${response}`;
            this.logClient.error(message);
            this.setHTMLValueText("error",  message);
          }
        }
        else {
          var message: string = `API Get Time - error: unexpected response from server: status = ${response.status}`;
          this.logClient.error(message);
          this.setHTMLValueText("error",  message);
        }
      }
      else {
        var error = "API Get Time - error : response null"
        this.logClient.error(error);
        this.setHTMLValueText("error",  error);
      }
    }
    catch (e) {
      var error = `Exception while calling API Get Time: ${e}`;
      this.logClient.error(error);
      this.setHTMLValueText("error",  error);
    }
    finally {
      waiting.hide();
    }

  }
  async getToDos(ev: any): Promise<void> {
    this.clearResultAndError();
    var waiting = new ButtonWaiting("api_gettodos_btn");        
    waiting.show(null, WaitCursorForm.grow);

    try {

      let response = await this.apiClient.GetToDos();
      if (response) {
        if (response.status == 200) {
          let responseObject: any = await response.json();
          if (Array.isArray(responseObject))
          //if (!isNullOrUndefinedOrEmpty(responseObject))
          {
            message = `ToDos count: ${responseObject.length} `;
            for (var i = 0; i < responseObject.length; i++) {
              message += ` id: ${responseObject[i].id} name: ${responseObject[i].name}`;
            }
            var message: string = `API Get ToDos - length: ${message}`;
            this.logClient.log(message);
            this.setHTMLValueText("output", message);
          }
          else {
            var message: string = `API Get ToDos - error: can't parse response object ${response}`;
            this.logClient.error(message);
            this.setHTMLValueText("error", message);
          }
        }
        else {
          var message: string = `API Get ToDos - error: unexpected response from server: status = ${response.status}`;
          this.logClient.error(message);
          this.setHTMLValueText("error", message);
        }
      }
      else {
        var error = "API Get ToDos - error : response null"
        this.logClient.error(error);
        this.setHTMLValueText("error", error);
      }
    }
    catch (e) {
      var error = `Exception while calling API Get ToDos: ${e}`;
      this.logClient.error(error);
      this.setHTMLValueText("error", error);
    }
    finally {
      waiting.hide();
    }

  }

  callPOSTAPIAsync(endpoint: string, token: string, opts: any): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
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

      const options = {
        method: "POST",
        headers: headers,
        body: JSON.stringify(opts)
      };

      fetch(endpoint, options)
        .then(response => resolve(response))
        .catch(error => {
          this.logClient.error(error);
          reject(error)
        })
    });
  }

  IsExtensionSupported(path: string) {

    if ((path !== null) && (path !== undefined)) {
      var fileExtension = path.substring(path.lastIndexOf(".") + 1, path.length);
      if (fileExtension === "xls" || fileExtension === "xlsx" || fileExtension === "pdf" || fileExtension === "doc" || fileExtension === "docx" || fileExtension === "txt") {
        return true;
      }
    }
    return false;
  };

  HasValidFiles(files: any) {
    if ((files !== null) && (files !== undefined)) {
      for (var i = 0; i < files.length; i++) {
        if (this.IsExtensionSupported(files[i].name)) {
          return true;
        }
      }
    }
    return false;
  };

  UpdateControls() {

    var eltFileselectionbutton = (<HTMLInputElement>document.getElementById("files_btn"));

    if (this.HasValidFiles(eltFileselectionbutton.files) == true) {
      (<HTMLButtonElement>document.getElementById("upload_btn")).disabled = false;
      // eltFileselectionbutton.disabled = true;
    }
    else {
      (<HTMLButtonElement>document.getElementById("upload_btn")).disabled = true;
      //  eltFileselectionbutton.disabled = false;
    }

  };

  onFileChange(event: any) {
    var input = (<HTMLInputElement>document.getElementById("files_btn"));
    if(input){
      this.uploadTable?.addFiles(input.files);
      this.UpdateControls();
    }
  };
  clearInputs = function () {
    if (isNullOrUndefined((<HTMLInputElement>document.getElementById("files_btn")).files) === false)
      (<HTMLInputElement>document.getElementById("files_btn")).value = "";
  };


  progressFunction(path: string, folder: string, progress: number) {
    this.uploadTable?.setProgressValue(path, progress);
  }
  completeFunction(path: string, folder: string, error: string | undefined) {
    if (!isNullOrUndefinedOrEmpty(error)) {

      this.logClient.error(`Error ${error} for path ${path}`);
    }
    else {
      this.logClient.log(`successful for path ${path}`);
      this.progressFunction(path, folder, 100)
    }
  }
  logMessage(message: string): void {
    this.logClient.error(message);
    this.setHTMLValueText("output", message);
  }
  logError(message: string): void {
    this.logClient.error(message);
    this.setHTMLValueText("error", message);
  }
  uploadBlobs(ev: any): Promise<void> {
    var waiting = new ButtonWaiting("upload_btn");        
    waiting.show(null, WaitCursorForm.grow);

    this.clearResultAndError();
    return new Promise<void>(async (resolve, reject) => {
      try {
        var fileslength = 0;
        if ((<HTMLInputElement>document.getElementById('files_btn')) != null) {
          var listFiles = (<HTMLInputElement>document.getElementById('files_btn')).files;
          if (listFiles != null)
            fileslength = listFiles.length;
        }
        var filesinput = (<HTMLInputElement>document.getElementById('files_btn')).files;
        if ((filesinput) && (filesinput.length > 0)) {
          var message = `Launch upload of file: ${filesinput[0].name} size ${filesinput[0].size} bytes `;
          this.logMessage(message);
          var result = await this.storageClient.uploadFilesWithProgessAsync(filesinput, "test",
            (file: string, folder: string, progress: number) => {
              this.progressFunction(file, folder, progress);
            });
          if (result == true) {
            if (this.storageClient) {
              var uri: string = this.storageClient.getStorageUri(filesinput[0].name, "test");
              if (uri) {
                var message = `File: ${filesinput[0].name} size ${filesinput[0].size} bytes successfully uploaded, uri: ${uri}`;
                this.logMessage(message);
              }
            }
          }
          else {
            var error = `File: ${filesinput[0].name} size ${filesinput[0].size} bytes upload failed`;
            this.logError(error);
          }
        }
        this.UpdateControls();
        waiting.hide();
        resolve();
      }
      catch (e) {
        var error = `Error while uploading file: ${e}`;
        this.logError(error);
        this.UpdateControls();
        waiting.hide();
        reject(e)
      }
      finally {
        waiting.hide();
      }
    });
  };
  clearCache(ev: any): void {
    var waiting = new ButtonWaiting("cache_btn");        
    waiting.show(null, WaitCursorForm.grow);
    this.logClient.log("Clearing cache in 'sessionStorage'");
    sessionStorage.clear();
    var message: string = "Cache in 'sessionStorage' cleared";
    this.logClient.log(message);
    this.setHTMLValueText("output", message);
    waiting.hide();
  }
  alert(ev: any): void {
    var alert = new Alert("div_test");        
    alert.showAlert("Alert Title","Alert Message","Alert Button");
  }
  toast(ev: any): void {
    var toast = new Toast("div_test");        
    toast.showToast("Toast Title","Toast Message","Toast Time", 2000);
  }
  progress(ev: any): void {
    var progress = new Progress("div_test");        
    progress.showProgress("Title","Message: Display progress during 2 seconds", WaitCursorForm.border,null, 2000);
  }
  buttonWaiting(ev: any): void {
    var buttonWaiting = new ButtonWaiting("ui_button_waiting_btn");        
    buttonWaiting.show(null, WaitCursorForm.grow);
    setTimeout(() => {
      buttonWaiting.hide();      
      buttonWaiting.show(null, WaitCursorForm.border);
      setTimeout(() => {
        buttonWaiting.hide();      
      }, 2000);
    }, 2000);
  }
  pageWaiting(ev: any): void {
    var pageWaiting = new PageWaiting("div_test");        
    pageWaiting.show("Waiting text during 2 seconds", WaitCursorForm.grow);
    setTimeout(() => {
      pageWaiting.hide();      
      pageWaiting.show("Waiting text during 2 seconds", WaitCursorForm.border);
      setTimeout(() => {
        pageWaiting.hide();      
      }, 2000);
    }, 2000);
  }

  registerEvents(): boolean {
    if (super.registerEvents)
      super.registerEvents();
    super.addEvent("signin_btn", "click", (ev: any) => { this.signIn(ev); });
    super.addEvent("signout_btn", "click", (ev: any) => { this.signOut(ev); });
    super.addEvent("isconnected_btn", "click", (ev: any) => { this.isConnected(ev); });
    super.addEvent("account_btn", "click", (ev: any) => { this.getAccount(ev); });
    super.addEvent("graph_btn", "click", (ev: any) => { this.getGraphAccount(ev); });
    super.addEvent("mail_btn", "click", (ev: any) => { this.getMail(ev); });
    super.addEvent("upload_btn", "click", (ev: any) => { this.uploadBlobs(ev); });
    super.addEvent("files_btn", "change", (ev: any) => { this.onFileChange(ev); });
    super.addEvent("api_getversion_btn", "click", (ev: any) => { this.getVersion(ev); });
    super.addEvent("api_gettime_btn", "click", (ev: any) => { this.getTime(ev); });
    super.addEvent("api_gettodos_btn", "click", (ev: any) => { this.getToDos(ev); });
    super.addEvent("cache_btn", "click", (ev: any) => { this.clearCache(ev); });
    super.addEvent("ui_alert_btn", "click", (ev: any) => { this.alert(ev); });
    super.addEvent("ui_progress_btn", "click", (ev: any) => { this.progress(ev); });
    super.addEvent("ui_toast_btn", "click", (ev: any) => { this.toast(ev); });
    super.addEvent("ui_page_waiting_btn", "click", (ev: any) => { this.pageWaiting(ev); });
    super.addEvent("ui_button_waiting_btn", "click", (ev: any) => { this.buttonWaiting(ev); });

    return true;
  }
  unregisterEvents(): boolean {
    if (super.unregisterEvents)
      super.unregisterEvents();
    super.removeEvent("signin_btn", "click", (ev: any) => { this.signIn(ev); });
    super.removeEvent("signout_btn", "click", (ev: any) => { this.signOut(ev); });
    super.removeEvent("isconnected_btn", "click", (ev: any) => { this.isConnected(ev); });
    super.removeEvent("account_btn", "click", (ev: any) => { this.getAccount(ev); });
    super.removeEvent("graph_btn", "click", (ev: any) => { this.getGraphAccount(ev); });
    super.removeEvent("mail_btn", "click", (ev: any) => { this.getMail(ev); });
    super.removeEvent("upload_btn", "click", (ev: any) => { this.uploadBlobs(ev); });
    super.removeEvent("files_btn", "change", (ev: any) => { this.onFileChange(ev); });
    super.removeEvent("api_getversion_btn", "click", (ev: any) => { this.getVersion(ev); });
    super.removeEvent("api_gettime_btn", "click", (ev: any) => { this.getTime(ev); });
    super.removeEvent("api_gettodos_btn", "click", (ev: any) => { this.getToDos(ev); });
    super.removeEvent("cache_btn", "click", (ev: any) => { this.clearCache(ev); });
    super.removeEvent("ui_alert_btn", "click", (ev: any) => { this.alert(ev); });
    super.removeEvent("ui_progress_btn", "click", (ev: any) => { this.progress(ev); });
    super.removeEvent("ui_toast_btn", "click", (ev: any) => { this.toast(ev); });
    super.removeEvent("ui_page_waiting_btn", "click", (ev: any) => { this.pageWaiting(ev); });
    super.removeEvent("ui_button_waiting_btn", "click", (ev: any) => { this.buttonWaiting(ev); });
    return true;
  }
  onInitializePage(): boolean {
    this.addHTMLValueMap([
      { id: "versionButton",  value: this.version, readonly: true },
    ]);    
    // Create upload table
    this.uploadTable?.create(
      [globalThis.globalVars.getCurrentString('Path'),globalThis.globalVars.getCurrentString('Size'),globalThis.globalVars.getCurrentString('Status'), ""],
      globalThis.globalVars.getCurrentString('No file selected'));
    this.clearInputs();
    this.clearResultAndError();
    this.updateData(false);
    this.UpdateControls();
    return true;
  }
}


let localPage = new TestsPage("content", "Tests", "tests.html", null,
  globalThis.globalConfiguration.version,
  globalThis.globalClient.getLogClient(),
  globalThis.globalClient.getAzureADClient(),
  globalThis.globalClient.getStorageClient(),
  globalThis.globalClient.getAPIClient(),
  globalThis.globalConfiguration.apiGridwichEndpoint,
  globalThis.globalConfiguration.storageAccountName,
  globalThis.globalConfiguration.storageContainerName,
  globalThis.globalConfiguration.msAuthConfig.auth.redirectUri,
);
if (localPage) {
  // Initialize Page  
  localPage.initializePage();
}
