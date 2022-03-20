import { Dialog } from "./dialog";
import { APIClient } from "./apiclient";
import { isNullOrUndefinedOrEmpty, isNullOrUndefined } from "./common";
import { StorageClient } from "./storage";
import { LogClient } from './logclient';
import { ButtonWaiting, WaitCursorColor, WaitCursorForm } from "./notificationclient";
import { UploadTable } from "./uploadTable";
/**
 * IDialog
 */
export class UpdateToDoDialog extends Dialog {
  todoId: string = "";
  todoName: string = "";
  todoUri: string = "";
  todoFolder: string = "";
  todoExtensions: Array<string> = [];
  message: string = "";

  apiClient: APIClient;
  storageClient: StorageClient;
  logClient: LogClient;
  uploadTable: UploadTable|null;
  static current?: UpdateToDoDialog;
  constructor(id: string, name: string, uri: string | null, content: string | null, okId: string, apiClient: APIClient, storageClient: StorageClient, logClient: LogClient) {
    super(id, name, uri, content, okId);
    this.apiClient = apiClient;
    this.storageClient = storageClient;
    this.logClient = logClient;
    this.uploadTable = new UploadTable("updateUploadFilesTable"); 
    UpdateToDoDialog.current = this;
  }
  static createUpdateToDoDialog(id: string, name: string, uri: string | null, content: string | null, okId: string, apiClient: APIClient, storageClient: StorageClient, logClient: LogClient): UpdateToDoDialog {
    return new UpdateToDoDialog(id, name, uri, content, okId, apiClient, storageClient, logClient);
  }
  onUpdate?(update: boolean): void;
  selectFileChanged() {
    this.updateData(true);
    var input = (<HTMLInputElement>document.getElementById("updateSelectFile"));
    if(input){
      this.uploadTable?.addFiles(input.files);
    }  
    this.updateControls("updateSelectFile", "updateUploadFile");
  }
  async uploadFile() {
    console.log("calling this.uploadBlobs");
    try {
      this.updateData(true);
      var folder = this.todoFolder
      await this.uploadBlobs(folder);
    }
    catch (e) {
      this.logError("calling this.uploadBlobs Exception: " + e);
    }
  }
  IsExtensionSupported(path: string) {

    if ((path !== null) && (path !== undefined)) {
      var fileExtension = path.substring(path.lastIndexOf(".") + 1, path.length);
      if (this.todoExtensions.includes(fileExtension)) {
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
  updateControls(selectId: string, uploadId: string) {
    var inputFiles = (<HTMLInputElement>document.getElementById(selectId));
    if (inputFiles) {
      if (this.HasValidFiles(inputFiles.files) == true) {
        var upload = <HTMLButtonElement>document.getElementById(uploadId);
        if (upload)
          upload.disabled = false;
        //inputFiles.disabled = true;
      }
      else {
        var upload = <HTMLButtonElement>document.getElementById(uploadId);
        if (upload)
          upload.disabled = true;
        //inputFiles.disabled = false;
      }
    }
  };
  updateModalControls(nameId: string, uriId: string, okId: string): void {
    var updatedName: boolean = false;
    var updatedUri: boolean = false;
    const name = (<HTMLInputElement>document.getElementById(nameId));
    if (name) {
      if ((name.value) && (name.value.length > 0) && (this.todoName != name.value)) {
        updatedName = true;
      }
    }
    const uri = (<HTMLInputElement>document.getElementById(uriId));
    if (uri) {
      if ((uri.value) && (uri.value.length > 0) && (this.todoUri != uri.value)) {
        updatedUri = true;
      }
    }
    const ok = (<HTMLButtonElement>document.getElementById(okId));
    if (ok) {
      if ((updatedUri == true) || (updatedName == true)) {
        var message = `Are you sure you want to update todo ${this.todoId}?`;
        this.setHTMLValueText("updateMessage", message);
        ok.disabled = false;
      }
      else {
        var message = "";
        this.setHTMLValueText("updateMessage", message);
        ok.disabled = true;
      }
    }
  }

  clearInputs(selectId: string): void {
    if (isNullOrUndefined((<HTMLInputElement>document.getElementById(selectId)).files) === false)
      (<HTMLInputElement>document.getElementById(selectId)).value = "";
  };

  progressFunction(path: string, folder: string, progress: number) {
    this.uploadTable?.setProgressValue(path, progress);
  }
  logMessage(message: string): void {
    this.logClient.log(message);
    this.setHTMLValueText("updateMessage", message);
  }
  logError(message: string): void {
    this.logClient.error(message);
    this.setHTMLValueText("updateError",  message);
  }
  clearResultAndError() {
    this.setHTMLValueText("updateMessage",  "");
    this.setHTMLValueText("updateError",  "");
  }

  uploadBlobs(folder: string): Promise<void> {
    var waiting = new ButtonWaiting("updateUploadFile")
    waiting.show();
    this.clearResultAndError();
    return new Promise<void>(async (resolve, reject) => {
      try {
        var fileslength = 0;
        if ((<HTMLInputElement>document.getElementById("updateSelectFile")) != null) {
          var listFiles = (<HTMLInputElement>document.getElementById("updateSelectFile")).files;
          if (listFiles != null)
            fileslength = listFiles.length;
        }
        var filesinput = (<HTMLInputElement>document.getElementById("updateSelectFile")).files;
        if ((filesinput) && (filesinput.length > 0)) {
          var message = `Launch upload of file: ${filesinput[0].name} size ${filesinput[0].size} bytes `;
          this.logMessage(message);
          var result = await this.storageClient.uploadFilesWithProgessAsync(filesinput, folder,
            (file: string, folder: string, progress: number) => {
              this.progressFunction(file, folder, progress);
            });
          if (result == true) {
            if (this.storageClient) {
              var uri: string = this.storageClient.getStorageUri(filesinput[0].name, folder);
              if (uri) {
                var uriCtl = <HTMLInputElement>document.getElementById("updateToDoUri");
                if (uriCtl) {
                  uriCtl.value = uri;
                }
                this.updateModalControls("updateToDoName", "updateToDoUri", "updateOk");
                this.updateControls("updateSelectFile", "updateUploadFile");
              }
            }
          }
          else {
            var error = `File: ${filesinput[0].name} size ${filesinput[0].size} bytes upload failed`;
            this.logMessage(error);
          }
        }
        this.updateControls("updateSelectFile", "updateUploadFile");
        waiting.hide();
        resolve();
      }
      catch (e) {
        var error = `Error while uploading file: ${e}`;
        this.logError(error);
        this.updateControls("updateSelectFile", "updateUploadFile");
        waiting.hide();
        reject(e)
      }
      finally {
        waiting.hide();
      }
    });
  };

  valueUpdated() {
    this.updateData(true);
    this.updateModalControls("updateToDoName", "updateToDoUri", "updateOk");
  }
  static StaticOnOkCloseDialog() {
    if (UpdateToDoDialog.current)
      UpdateToDoDialog.current.onOkCloseDialog("updateOk");
  }
  static StaticOnCancelCloseDialog() {
    if (UpdateToDoDialog.current)
      UpdateToDoDialog.current.onCancelCloseDialog("updateCancel");
  }
  static StaticSelectFileChanged() {
    if (UpdateToDoDialog.current)
      UpdateToDoDialog.current.selectFileChanged();
  }
  static StaticUploadFile() {
    if (UpdateToDoDialog.current)
      UpdateToDoDialog.current.uploadFile();
  }
  static StaticValueUpdated() {
    if (UpdateToDoDialog.current)
      UpdateToDoDialog.current.valueUpdated();
  }
  registerEvents(): boolean {
    if (super.registerEvents)
      super.registerEvents();
    super.addEvent("updateOk", "click", UpdateToDoDialog.StaticOnOkCloseDialog);
    super.addEvent("updateCancel", "click", UpdateToDoDialog.StaticOnCancelCloseDialog);
    super.addEvent("updateSelectFile", "change", UpdateToDoDialog.StaticSelectFileChanged);
    super.addEvent("updateUploadFile", "click", UpdateToDoDialog.StaticUploadFile);
    super.addEvent("updateToDoUri", "change", UpdateToDoDialog.StaticValueUpdated);
    super.addEvent("updateToDoName", "change", UpdateToDoDialog.StaticValueUpdated);
    return true;
  }
  unregisterEvents(): boolean {
    if (super.unregisterEvents)
      super.unregisterEvents();
    super.removeEvent("updateOk", "click", UpdateToDoDialog.StaticOnOkCloseDialog);
    super.removeEvent("updateCancel", "click", UpdateToDoDialog.StaticOnCancelCloseDialog);
    super.removeEvent("updateSelectFile", "change", UpdateToDoDialog.StaticSelectFileChanged);
    super.removeEvent("updateUploadFile", "click", UpdateToDoDialog.StaticUploadFile);
    super.removeEvent("updateToDoUri", "change", UpdateToDoDialog.StaticValueUpdated);
    super.removeEvent("updateToDoName", "change", UpdateToDoDialog.StaticValueUpdated);
    return true;
  }
  onInitializeDialog(): boolean {
    this.message = "";

    this.addHTMLValueMap([
       { id: "updateMessage",  value: this.message, readonly: true },
       { id: "updateToDoId",  value: this.todoId, readonly: false },
       { id: "updateToDoName",  value: this.todoName, readonly: false },
       { id: "updateToDoUri",  value: this.todoUri, readonly: false },
    ]);
    this.updateData(false);
    this.uploadTable?.create(
      [globalThis.globalVars.getCurrentString('Path'),globalThis.globalVars.getCurrentString('Size'),globalThis.globalVars.getCurrentString('Status'), ""],
      globalThis.globalVars.getCurrentString('No file selected'));      
    var input: HTMLInputElement = <HTMLInputElement>document.getElementById("updateSelectFile");
    if (input) {
      var accept: string = "";
      for (var i = 0; i < this.todoExtensions.length; i++)
        accept += `.${this.todoExtensions[i]},`;
      input.accept = accept;
    }
    this.clearInputs("updateSelectFile");
    this.clearResultAndError();

    this.updateModalControls("updateToDoName", "updateToDoUri", "updateOk")
    this.updateControls("updateSelectFile", "updateUploadFile");
    return true;
  }
  onCancelCloseDialog(id: string) {
    try {
      this.endDialog(id);
    }
    catch (e) {

    }
  }
  async onOkCloseDialog(id: string) {
    try {
      // Read values from the Web UI
      this.updateData(true);
      this.todoName = String(this.getHTMLValue("updateToDoName")?.value);
      this.todoUri = String(this.getHTMLValue("updateToDoUri")?.value);
      if ((this.todoName.length > 0) && (this.todoUri.length > 0)) {
        var result = await this.AddAsync();
        if (result == true)
          this.endDialog(id);
      }
      else {
        var message: string = "ToDo creation failed: todo Name or Uri not defined";
        this.setHTMLValueText("updateMessage", message);
      }
    }
    catch (e) {
      var message: string = `Exception while creating ToDo ${e}`;
      this.setHTMLValueText("updateMessage", message);
    }
  }
  AddAsync(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        var response: Response | null = await this.apiClient.UpdateToDo(this.todoId,
          { name: this.todoName, uri: this.todoUri }
        );
        if (response) {
          if (response.status == 200) {
            var message: string = `ToDo: ${this.todoName} successfully updated`;
            this.setHTMLValueText("updateMessage", message);
            resolve(true);
            return;
          }
          else {
            var message: string = `Error while updating todo: response status ${response.status}`;
            this.setHTMLValueText("updateMessage", message);
            reject(message);
            return;
          }
        }
        else {
          var message: string = `Error while updating todo: response null`;
          this.setHTMLValueText("updateMessage", message);
          reject(message);
          return;
        }
      }
      catch (reason) {
        var message: string = `Exception while updating todo: ${reason}`;
        this.setHTMLValueText("updateMessage", message);
        reject(message);
        return;
      };
    });
  }
  onCancel(): boolean {
    return true;
  }

}
