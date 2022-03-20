import { Dialog } from "./dialog";
import { APIClient } from "./apiclient";
import { LogClient } from "./logclient";

/**
 * IDialog
 */
export class RemoveToDoDialog extends Dialog {
  todoId: string = "";
  message: string = "";
  logClient: LogClient;
  apiClient: APIClient;
  static current?: RemoveToDoDialog;
  constructor(id: string, name: string, uri: string | null, content: string | null, okId: string, logClient: LogClient, apiClient: APIClient) {
    super(id, name, uri, content, okId);
    this.logClient = logClient;
    this.apiClient = apiClient;
    RemoveToDoDialog.current = this;
  }
  static createRemoveToDoDialog(id: string, name: string, uri: string | null, content: string | null, okId: string, logClient: LogClient, apiClient: APIClient): RemoveToDoDialog {
    return new RemoveToDoDialog(id, name, uri, content, okId, logClient, apiClient);
  }
  onUpdate?(update: boolean): void;


  registerEvents(): boolean {
    if (super.registerEvents)
      super.registerEvents();
    super.addEvent("removeOk", "click", RemoveToDoDialog.StaticOnOkCloseDialog);
    super.addEvent("removeCancel", "click", RemoveToDoDialog.StaticOnCancelCloseDialog);
    this.logClient.log("RemoveToDoDialog registerEvents");
    return true;
  }
  static StaticOnOkCloseDialog() {
    if (RemoveToDoDialog.current)
      RemoveToDoDialog.current.onOkCloseDialog("removeOk");
  }
  static StaticOnCancelCloseDialog() {
    if (RemoveToDoDialog.current)
      RemoveToDoDialog.current.onCancelCloseDialog("removeCancel");
  }
  unregisterEvents(): boolean {
    if (super.unregisterEvents)
      super.unregisterEvents();
    super.removeEvent("removeOk", "click", RemoveToDoDialog.StaticOnOkCloseDialog);
    super.removeEvent("removeCancel", "click", RemoveToDoDialog.StaticOnCancelCloseDialog);
    this.logClient.log("RemoveToDoDialog unregisterEvents");
    return true;
  }
  onInitializeDialog(): boolean {
    this.message = `Are you sure you want to remove todo ${this.todoId}?`;
    this.addHTMLValueMap([
      { id: "removeMessage",  value: this.message, readonly: true },
   ]);
    return true;
  }
  async onOkCloseDialog(id: string) {
    try {
      var result = await this.DeleteAsync();
      if (result == true)
        this.endDialog(id);
    }
    catch (e) {

    }
  }
  onCancelCloseDialog(id: string) {
    try {
      this.endDialog(id);
    }
    catch (e) {

    }
  }
  DeleteAsync(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        var response: Response | null = await this.apiClient.DeleteToDo(this.todoId);
        if (response) {
          if (response.status == 200) {
            resolve(true);
            return;
          }
          else {
            var message: string = `Error while removing todo: response status ${response.status}`;
            this.setHTMLValueText("removeMessage", message);
            reject(message);
            return;
          }
        }
        else {
          var message: string = `Error while removing todo: response null`;
          this.setHTMLValueText("removeMessage", message);
          reject(message);
          return;
        }
      }
      catch (reason) {
        var message: string = `Exception while removing todo: ${reason}`;
        this.setHTMLValueText("removeMessage", message);
        reject(message);
        return;
      };
    });
  }
  onCancel(): void {
    return;
  }

}
