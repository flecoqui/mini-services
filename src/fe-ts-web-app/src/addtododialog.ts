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
export class AddToDoDialog extends Dialog {
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
  static current?: AddToDoDialog;
  constructor(id: string, name: string, uri: string | null, content: string | null, okId: string, apiClient: APIClient, storageClient: StorageClient, logClient: LogClient) {
    super(id, name, uri, content, okId);
    this.apiClient = apiClient;
    this.storageClient = storageClient;
    this.logClient = logClient;
    this.uploadTable = new UploadTable("addUploadFilesTable");    
    AddToDoDialog.current = this;
  }
  static createAddToDoDialog(id: string, name: string, uri: string | null, content: string | null, okId: string, apiClient: APIClient, storageClient: StorageClient, logClient: LogClient): AddToDoDialog {
    return new AddToDoDialog(id, name, uri, content, okId, apiClient, storageClient, logClient);
  }
  onUpdate?(update: boolean): void;
  selectFileChanged() {
    this.updateData(true);
    var input = (<HTMLInputElement>document.getElementById("addSelectFile"));
    if(input){
      this.uploadTable?.addFiles(input.files);
    }    
    this.updateControls("addSelectFile", "addUploadFile");
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
    var valid: boolean = false;
    const name = (<HTMLInputElement>document.getElementById(nameId));
    var text: string = name.value;
    if ((text) && (text.length > 0)) {
      const uri = (<HTMLInputElement>document.getElementById(uriId));
      var text: string = uri.value;
      if ((text) && (text.length > 0)) {
        valid = true;
      }
    }
    const ok = (<HTMLButtonElement>document.getElementById(okId));
    if (ok) {
      if (valid == true) {
        var message = `Are you sure you want to add todo ${this.todoId}?`;
        this.setHTMLValueText("addMessage", message);
        ok.disabled = false;
      }
      else {
        var message = "";
        this.setHTMLValueText("addMessage", message);
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
    this.setHTMLValueText("addMessage", message);
  }
  logError(message: string): void {
    this.logClient.error(message);
    this.setHTMLValueText("addError", message);
  }
  clearResultAndError() {
    this.setHTMLValueText("addMessage", "");
    this.setHTMLValueText("addError", "");
  }

  uploadBlobs(folder: string): Promise<void> {
    var waiting = new ButtonWaiting("addUploadFile");
    waiting.show();
    this.clearResultAndError();
    return new Promise<void>(async (resolve, reject) => {
      try {
        var fileslength = 0;
        if ((<HTMLInputElement>document.getElementById('addSelectFile')) != null) {
          var listFiles = (<HTMLInputElement>document.getElementById('addSelectFile')).files;
          if (listFiles != null)
            fileslength = listFiles.length;
        }
        var filesinput = (<HTMLInputElement>document.getElementById('addSelectFile')).files;
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
                var uriCtl = <HTMLInputElement>document.getElementById("addToDoUri");
                if (uriCtl) {
                  uriCtl.value = uri;
                }
                this.updateModalControls("addToDoName", "addToDoUri", "addOk");
                this.updateControls("addSelectFile", "addUploadFile");
              }
            }
          }
          else {
            var error = `File: ${filesinput[0].name} size ${filesinput[0].size} bytes upload failed`;
            this.logMessage(error);
          }
        }
        this.updateControls("addSelectFile", "addUploadFile");
        waiting.hide();
        resolve();
      }
      catch (e) {
        var error = `Error while uploading file: ${e}`;
        this.logError(error);
        this.updateControls("addSelectFile", "addUploadFile");
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
    this.updateModalControls("addToDoName", "addToDoUri", "addOk");
  }
  static StaticOnOkCloseDialog() {
    if (AddToDoDialog.current)
      AddToDoDialog.current.onOkCloseDialog("addOk");
  }
  static StaticOnCancelCloseDialog() {
    if (AddToDoDialog.current)
      AddToDoDialog.current.onCancelCloseDialog("addCancel");
  }
  static StaticSelectFileChanged() {
    if (AddToDoDialog.current)
      AddToDoDialog.current.selectFileChanged();
  }
  static StaticUploadFile() {
    if (AddToDoDialog.current)
      AddToDoDialog.current.uploadFile();
  }
  static StaticValueUpdated() {
    if (AddToDoDialog.current)
      AddToDoDialog.current.valueUpdated();
  }
  registerEvents(): boolean {
    if (super.registerEvents)
      super.registerEvents();
    super.addEvent("addOk", "click", AddToDoDialog.StaticOnOkCloseDialog);
    super.addEvent("addCancel", "click", AddToDoDialog.StaticOnCancelCloseDialog);
    super.addEvent("addSelectFile", "change", AddToDoDialog.StaticSelectFileChanged);
    super.addEvent("addUploadFile", "click", AddToDoDialog.StaticUploadFile);
    super.addEvent("addToDoUri", "change", AddToDoDialog.StaticValueUpdated);
    super.addEvent("addToDoName", "change", AddToDoDialog.StaticValueUpdated);
    return true;
  }
  unregisterEvents(): boolean {
    if (super.unregisterEvents)
      super.unregisterEvents();
    super.removeEvent("addOk", "click", AddToDoDialog.StaticOnOkCloseDialog);
    super.removeEvent("addCancel", "click", AddToDoDialog.StaticOnCancelCloseDialog);
    super.removeEvent("addSelectFile", "change", AddToDoDialog.StaticSelectFileChanged);
    super.removeEvent("addUploadFile", "click", AddToDoDialog.StaticUploadFile);
    super.removeEvent("addToDoUri", "change", AddToDoDialog.StaticValueUpdated);
    super.removeEvent("addToDoName", "change", AddToDoDialog.StaticValueUpdated);
    return true;
  }
  onInitializeDialog(): boolean {
    this.message = "";
    this.addHTMLValueMap([
      { id: "addMessage",  value: this.message, readonly: true },
      { id: "addToDoId",  value: this.todoId, readonly: false },
      { id: "addToDoName",  value: this.todoName, readonly: false },
      { id: "addToDoUri",  value: this.todoUri, readonly: false },
   ]);    
    this.updateData(false);
    // Create upload table
    this.uploadTable?.create(
      [globalThis.globalVars.getCurrentString('Path'),globalThis.globalVars.getCurrentString('Size'),globalThis.globalVars.getCurrentString('Status'), ""],
      globalThis.globalVars.getCurrentString('No file selected'));    
    this.clearInputs("addSelectFile");
    this.clearResultAndError();

    var input: HTMLInputElement = <HTMLInputElement>document.getElementById("addSelectFile");
    if (input) {
      var accept: string = "";
      for (var i = 0; i < this.todoExtensions.length; i++)
        accept += `.${this.todoExtensions[i]},`;
      input.accept = accept;
    }
    this.updateControls("addSelectFile", "addUploadFile");
    this.updateModalControls("addToDoName", "addToDoUri", "addOk")
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
      this.todoName = String(this.getHTMLValue("addToDoName")?.value);
      this.todoUri = String(this.getHTMLValue("addToDoUri")?.value);
      if ((this.todoName.length > 0) && (this.todoUri.length > 0)) {
        var result = await this.AddAsync();
        if (result == true)
          this.endDialog(id);
      }
      else {
        var message: string = "ToDo creation failed: todo Name or Uri not defined";
        this.setHTMLValueText("addMessage", message);
      }
    }
    catch (e) {
      var message: string = `Exception while creating ToDo ${e}`;
      this.setHTMLValueText("addMessage", message);
    }
  }
  AddAsync(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        var response: Response | null = await this.apiClient.CreateToDo(this.todoId,
          { id: this.todoId, name: this.todoName, uri: this.todoUri }
        );
        if (response) {
          if (response.status == 201) {
            var message: string = `ToDo: ${this.todoName} successfully added`;
            this.setHTMLValueText("addMessage", message);
            resolve(true);
            return;
          }
          else {
            var message: string = `Error while adding todo: response status ${response.status}`;
            this.setHTMLValueText("addMessage", message);
            reject(message);
            return;
          }
        }
        else {
          var message: string = `Error while adding todo: response null`;
          this.setHTMLValueText("addMessage", message);
          reject(message);
          return;
        }
      }
      catch (reason) {
        var message: string = `Exception while adding todo: ${reason}`;
        this.setHTMLValueText("addMessage", message);
        reject(message);
        return;
      };
    });
  }
  onCancel(): boolean {
    return true;
  }

}
