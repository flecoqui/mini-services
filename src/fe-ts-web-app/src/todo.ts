import './globalconfig';
import './globalclient';
import { LogClient } from './logclient';
import { StorageClient } from './storage';
import { APIClient, ToDo } from './apiclient';
import { AzureADClient } from './azuread';
import { isNullOrUndefinedOrEmpty, stringFormat, isNullOrUndefined, Guid } from "./common";
import { Page } from "./page";
import { AddToDoDialog } from './addtododialog';
import { UpdateToDoDialog } from './updatetododialog';
import { RemoveToDoDialog } from './removetododialog';
import { Table } from './table';
import { PageWaiting } from './notificationclient';


class ToDoPage extends Page {
  version: string;
  todoFolderFormat: string;
  todoExtensions: Array<string>;
  todoId: string;
  logClient: LogClient;
  adClient: AzureADClient;
  storageClient: StorageClient;
  apiClient: APIClient;
  removeToDoDlg?: RemoveToDoDialog;
  addToDoDlg?: AddToDoDialog;
  updateToDoDlg?: UpdateToDoDialog;
  table?: Table;
  static current?: ToDoPage;
  constructor(id: string,
    name: string,
    uri: string | null,
    content: string | null,
    version: string,
    folder: string,
    extensions: Array<string>,
    logClient: LogClient,
    adClient: AzureADClient,
    storageClient: StorageClient,
    apiClient: APIClient
  ) {
    super(id, name, uri, content);
    this.version = version;
    this.todoFolderFormat = folder;
    this.todoExtensions = extensions;
    this.todoId = "";
    this.logClient = logClient;
    this.adClient = adClient;
    this.storageClient = storageClient;
    this.apiClient = apiClient;
    ToDoPage.current = this;
  }


  updateModalVariables(nameId: string, uriId: string, name: string, uri: string): void {
    var valid: boolean = false;
    const namectl = (<HTMLInputElement>document.getElementById(nameId));
    if (namectl)
      namectl.value = name;
    const uriCtl = (<HTMLInputElement>document.getElementById(uriId));
    uriCtl.value = uri;
  }
  modal(modalId: string, option: string): void {
    const control = (<HTMLDivElement>document.getElementById(modalId));
    if (control) {
      if (option == "show") {
        control.style.display = "block";
        control.style.paddingRight = "17px";
        control.className = "modal fade show";
        document.body.className = "modal-open";
        var div: HTMLDivElement = <HTMLDivElement>document.createElement('div');
        if (div) {
          div.className = "modal-backdrop fade show";
          document.body.appendChild(div);
        }
      }
      if (option == "hide") {
        control.style.display = "none";
        control.className = "modal fade";
        document.body.className = "";
        var list: HTMLCollectionOf<Element> = document.body.getElementsByClassName("modal-backdrop");
        if ((list) && (list.length > 0)) {
          document.body.removeChild(list[0]);
        }
      }
    }
  }
  logMessage(message: string) {
    this.logClient.log(message);
    this.setHTMLValueText("todoMessage", message);
  }
  logError(message: string) {
    this.logClient.error(message);
    this.setHTMLValueText("todoError", message);
  }

  getListToDo() {
    return new Promise<number>(async (resolve: (value: number | PromiseLike<number>) => void, reject: (reason?: any) => void) => {
      try {

        if (this.apiClient) {
          console.log("Calling GetToDos")
          var response: Response | null = await this.apiClient.GetToDos();
          if (response) {
            if (response.status == 200) {
              var count = 0;
              var payload: Array<ToDo> = await response.json() as Array<ToDo>;
              if (payload) {
                count = payload.length;
                // Fill table
                this.fillTable(payload);                
              }
              resolve(count);
            }
            else {
              var error = "Error while calling GetToDos: response.status != 200";
              this.logError(error);
              reject(error);
            }
          }
          else {
            var error = "Error while calling GetToDos: response null";
            this.logError(error);
            reject(error);
          }
        }
        else {
          var error = "Internal Error apiclient null";
          this.logError(error);
          reject(error);
        }
      }
      catch (e) {
        var error = `Exception while calling GetToDos: ${e}`;
        this.logError(error);
        reject(error);
      }
      return true;
    });
  }
  newGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  formatDatetime(date: Date, format: string) {
    const _padStart = (value: number): string => value.toString().padStart(2, '0');
    return format
      .replace("yyyy", _padStart(date.getFullYear()))
      .replace("dd", _padStart(date.getDate()))
      .replace("mm", _padStart(date.getMonth() + 1))
      .replace("hh", _padStart(date.getHours()))
      .replace("ii", _padStart(date.getMinutes()))
      .replace("ss", _padStart(date.getSeconds()));
  }
  getFolder(format: string, todoid: string) {
    var account = this.adClient.getAccount();
    var user = "unknown";
    if (account)
      user = account.username
    // Add "/" add the end of format string
    if (!format.endsWith("/"))
      format += "/";
    return format.replace("{todo-id}", todoid)
      .replace("{date}", this.formatDatetime(new Date(Date.now()), "yyyy-mm-dd"))
      .replace("{time}", this.formatDatetime(new Date(Date.now()), "yyyy-mm-ddThh:ii:ss"))
      .replace("{user}", user)
      .replace("{random-id}", this.newGuid())
  }
  getNewToDoId(): Promise<string | null> {
    return new Promise<string | null>(async (resolve, reject) => {
      // Create new Guid
      var id = this.newGuid();
      // Check if the new Guid is not used in the database
      try {
        var response = await this.apiClient.GetToDo(id);
        if (response) {
          if (response.status == 404) {
            // New Guid ok
            resolve(id);
          }
          else if (response.status == 200) {
            resolve(null);
          }
          reject(`ToDo API return status code: ${response.status}`);
        }
        else
          reject("ToDo API return null response");
      }
      catch (e) {
        reject(e);
      }
    });
  }
  // Callback after successful todo deletion
  // Reload page
  removeToDook() {
    this.initializePage();
  }
  // Callback after successful todo creation
  // Reload page
  addToDook() {
    this.initializePage();
  }
  createAddToDoDialog(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        var id = await this.getNewToDoId();
        if (id)
          this.todoId = id;
      }
      catch (e) {
        this.logClient.error(e);
        reject(e);
        return;
      }
      this.updateData(true);
      if (!this.addToDoDlg)
        this.addToDoDlg = new AddToDoDialog("addToDoModal", "AddToDo", null, null, "addOk", this.apiClient, this.storageClient, this.logClient);
      if (this.addToDoDlg) {
        this.addToDoDlg.todoId = this.todoId;
        this.addToDoDlg.todoName = "";
        this.addToDoDlg.todoUri = "";
        this.addToDoDlg.todoFolder = this.getFolder(this.todoFolderFormat, this.todoId);
        this.addToDoDlg.todoExtensions = this.todoExtensions;
        this.addToDoDlg.initializeDialog();
        this.addToDoDlg.showDialog(() => { this.initializePage(); this.logClient.log("End dialog AddToDoDialog") });
      }
      resolve(true);
      return;
    });
  }
  createRemoveToDoDialog() {
    this.updateData(true);
    if (!this.removeToDoDlg)
      this.removeToDoDlg = new RemoveToDoDialog("removeToDoModal", "RemoveToDo", null, null, "removeOk", this.logClient, this.apiClient);
    if (this.removeToDoDlg) {
      this.removeToDoDlg.todoId = this.getSelectedId();
      this.removeToDoDlg.initializeDialog();
      this.removeToDoDlg.showDialog(() => { this.initializePage(); this.logClient.log("End dialog RemoveToDoDialog") });
    }
  }
  createUpdateToDoDialog() {
    this.updateData(true);
    if (!this.updateToDoDlg)
      this.updateToDoDlg = new UpdateToDoDialog("updateToDoModal", "UpdateToDo", null, null, "updateOk", this.apiClient, this.storageClient, this.logClient);
    if (this.updateToDoDlg) {
      this.todoId = this.getSelectedId();
      this.updateToDoDlg.todoId = this.todoId;
      this.updateToDoDlg.todoName = this.getSelectedName();
      this.updateToDoDlg.todoUri = this.getSelectedUri();
      this.updateToDoDlg.todoFolder = this.getFolder(this.todoFolderFormat, this.todoId);
      this.updateToDoDlg.todoExtensions = this.todoExtensions;
      this.updateToDoDlg.initializeDialog();
      this.updateToDoDlg.showDialog(() => { this.initializePage(); this.logClient.log("End dialog UpdateToDoDialog") });
    }
    return;
  }

  static StaticCreateAddToDoDialog() {
    if (ToDoPage.current)
      ToDoPage.current.createAddToDoDialog();
  }
  static StaticCreateUpdateToDoDialog() {
    if (ToDoPage.current)
      ToDoPage.current.createUpdateToDoDialog();
  }
  static StaticCreateRemoveToDoDialog() {
    if (ToDoPage.current)
      ToDoPage.current.createRemoveToDoDialog();
  }
  registerEvents(): boolean {
    this.logClient.log("ToDoPage registerEvents");

    super.addEvent("addToDo", "click", ToDoPage.StaticCreateAddToDoDialog);
    super.addEvent("updateToDo", "click", ToDoPage.StaticCreateUpdateToDoDialog);
    super.addEvent("removeToDo", "click", ToDoPage.StaticCreateRemoveToDoDialog);

    return true;
  };

  unregisterEvents(): boolean {
    this.logClient.log("ToDoPage unregisterEvents");

    super.removeEvent("addToDo", "click", ToDoPage.StaticCreateAddToDoDialog);
    super.removeEvent("updateToDo", "click", ToDoPage.StaticCreateUpdateToDoDialog);
    super.removeEvent("removeToDo", "click", ToDoPage.StaticCreateRemoveToDoDialog);

    return true;
  };
  updateData(update: boolean): boolean {
    let bUpdated: boolean = false;
    super.updateData(update);
    if (update) {
    }
    else {
      // Initialize controls
      var boxes = (<HTMLCollectionOf<HTMLInputElement>>document.getElementsByClassName("custom-control-input"));
      for (var i = 0; i < boxes.length; i++) {
        boxes[i].checked = false
      };
      const updateToDo = (<HTMLButtonElement>document.getElementById("updateToDo"));
      updateToDo.disabled = true;
      const removeToDo = (<HTMLButtonElement>document.getElementById("removeToDo"));
      removeToDo.disabled = true;
    }
    return true;
  }
  /*
  Table Management
  */
  fillTable(payload: any) {

    this.table?.fillTable(payload);
    this.table?.selectRow('id',this.todoId);
  }
  createTable() {
    if(this.table == null){
      var columns =
      [{
        title: '',
        field: ''
      },{
        title: globalThis.globalVars.getCurrentString('todoId'),
        field: 'id'
      }, {
        title: globalThis.globalVars.getCurrentString('todoName'),
        field: 'name'
      }, {
        title: globalThis.globalVars.getCurrentString('todoUri'),
        field: 'uri'
      },{
        title: globalThis.globalVars.getCurrentString('todoCreation'),
        field: 'creationDate'
      }/*,{
        title: globalThis.globalVars.getCurrentString('todoCreation'),
        field: 'error.creationDate'
      }*/
      ];
      this.table = new Table('todoTableId');      
      this.table?.createTable(columns,globalThis.globalVars.getGlobalPageSize(),'id',['removeToDo','updateToDo']);
    }
  }
  getSelectedId(): string {
    var array = this.table?.getSelection();
    if ((array) && (array.length)) {
      return array[0].id;
    }
    return "";
  }
  getSelectedName(): string {
    var array = this.table?.getSelection();
    if ((array) && (array.length)) {
      return array[0].name;
    }
    return "";
  }
  getSelectedUri(): string {
    var array = this.table?.getSelection();
    if ((array) && (array.length)) {
      return array[0].uri;
    }
    return "";
  }
  selectedId(id: string): boolean {
    if(this.table)
      return this.table?.selectRow('id',id);
    return false;
  }

  onInitializePage(): boolean {
    var waiting = new PageWaiting("todoWaiting");
    waiting.show("Loading ToDo records");
    this.addHTMLValueMap([
      { id: "versionButton",  value: this.version, readonly: true },
      { id: "addToDo",  value: globalThis.globalVars.getCurrentString("Add"), readonly: true },
      { id: "updateToDo",  value: globalThis.globalVars.getCurrentString("Update"), readonly: true },
      { id: "removeToDo",  value: globalThis.globalVars.getCurrentString("Remove"), readonly: true },
      { id: "ToDoPageVersion",  value: globalThis.globalVars.getCurrentString("Version:"), readonly: true },
      { id: "ToDoPageTitle",  value: globalThis.globalVars.getCurrentString("ToDo Page"), readonly: true },
    ]);
    this.updateData(false);
    // Initialize Page  
    this.createTable();
    this.getListToDo()
      .then((count) => {
        //this.logMessage(stringFormat(globalThis.globalVars.getCurrentString("{0} record(s) in ToDo table"), count.toString()));
      })
      .catch((e) => {
        this.logError(`Error while loading page: ${e}`);
      })
      .finally(() => {
        waiting.hide();
      });
    return true;
  }
}



let localPage = new ToDoPage("content", "ToDo", "todo.html", null,
  globalThis.globalConfiguration.version,
  globalThis.globalConfiguration.todoFolder,
  globalThis.globalConfiguration.todoExtensions,
  globalThis.globalClient.getLogClient(),
  globalThis.globalClient.getAzureADClient(),
  globalThis.globalClient.getStorageClient(),
  globalThis.globalClient.getAPIClient(),
);
if (localPage) {
  localPage.initializePage();
}
