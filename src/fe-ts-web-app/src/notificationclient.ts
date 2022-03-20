
import { isNullOrUndefined, isNullOrUndefinedOrEmpty } from "./common";


export enum CursorForm {
    none = 0,
    border,
    grow
}

export class Alert {
    alertId: string;
    constructor(alertId: string) {
        this.alertId = alertId;
    }

    showAlert(title: string, message: string, button: string, timeout: number = 0): boolean {
        if (!isNullOrUndefinedOrEmpty(this.alertId)) {
            var modalContent: string = `<div class="modal" tabindex="-1" role="dialog" >
                <div class="modal-dialog" role="document" >
                    <div class="modal-content" >
                        <div class="modal-header" >
                            <h5 class="modal-title" >${title}</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="${button}" >
                                <span aria-hidden="true" >&times;</span>
                            </button>
                        </div>
                        <div class="modal-body" >
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer" >
                            <button type="button" class="mini-button mini-button-text" data-dismiss="modal" >${button}</button>
                        </div>
                   </div>
              </div>
           </div>`;

            const parent = (<HTMLDivElement>document.getElementById(this.alertId));
            if (parent) {
                this.clearModalChildren(this.alertId);
                var child = this.htmlToElement(modalContent) as HTMLDivElement;
                if (child) {
                    child.style.display = "block";
                    child.style.paddingRight = "17px";
                    child.className = "modal fade show";
                    document.body.className = "modal-open";
                    var div: HTMLDivElement = <HTMLDivElement>document.createElement('div');
                    if (div) {
                        div.className = "modal-backdrop fade show";
                        document.body.appendChild(div);
                    }
                    parent.appendChild(child);
                    var listmodal = parent.getElementsByClassName("modal-content");
                    if ((listmodal) && (listmodal.length > 0)) {
                      for (var i = 0; i < listmodal.length; i++){
                        var list = listmodal[i].getElementsByTagName("BUTTON");
                        if (list) {
                          for (var i = 0; i < list.length; i++)
                              list[i].addEventListener("click", () => {
                                  this.hideAlert();
                              });
                        }
                        
                      }
                    }

                }
            }
            if (timeout > 0) {
                setTimeout(() => { this.hideAlert(); }, timeout);
            }
            return true;
        }
        return false;
    }
    hideAlert(): boolean {
        if (!isNullOrUndefinedOrEmpty(this.alertId)) {
            const control = (<HTMLDivElement>document.getElementById(this.alertId));
            if (control) {
                var list = control.getElementsByClassName("modal");
                if ((list) && (list.length > 0)) {
                    control.removeChild(list[0]);
                }
                document.body.className = "";
                var list: HTMLCollectionOf<Element> = document.body.getElementsByClassName("modal-backdrop");
                if ((list) && (list.length > 0)) {
                    document.body.removeChild(list[0]);
                }
            }
            return true;
        }
        return false;
    }
    protected htmlToElement(html: string) {
        var template = document.createElement('template');
        template.innerHTML = html;
        return template.content.firstChild;
    }
    protected clearModalChildren(id: string) {
        const control = (<HTMLDivElement>document.getElementById(id));
        if (control) {
            var list = control.getElementsByClassName("modal");
            if ((list) && (list.length > 0)) {
                control.removeChild(list[0]);
            }
        }
    }
}
export enum WaitCursorForm {
    border = 1,
    grow
  }
  export enum WaitCursorColor {
    blue = 1,
    red,
    green,
    yellow,
    purple,
    orange,
    dark,
    light
  }
export class Progress extends Alert{
    constructor(alertId: string) {
        super(alertId);
    }
    showProgress(title: string, message: string,form: WaitCursorForm = WaitCursorForm.border, color: WaitCursorColor|null = null, timeout: number = 0): boolean {
        var localForm = "spinner-border";
        var localColor = "mini-spinner";
        if (form) {
          if (form == WaitCursorForm.border)
            localForm = "spinner-border";
          else if (form == WaitCursorForm.grow)
            localForm = "spinner-grow";
        }
        if (color) {
          if (color == WaitCursorColor.blue)
            localColor = "mini-text-color-blue";
          else if (color == WaitCursorColor.dark)
            localColor = "mini-text-color-dark";
          else if (color == WaitCursorColor.green)
            localColor = "mini-text-color-green";
          else if (color == WaitCursorColor.light)
            localColor = "mini-text-color-light";
          else if (color == WaitCursorColor.orange)
            localColor = "mini-text-color-orange";
          else if (color == WaitCursorColor.purple)
            localColor = "mini-text-color-purple";
          else if (color == WaitCursorColor.red)
            localColor = "mini-text-color-red";
          else if (color == WaitCursorColor.yellow)
            localColor = "mini-text-color-yellow";
        }

        if (!isNullOrUndefinedOrEmpty(this.alertId)) {
            var modalContent: string = `<div class="modal" tabindex="-1" role="dialog" >
                <div class="modal-dialog" role="document" >
                    <div class="modal-content" >
                        <div class="modal-header" >
                            <h5 class="modal-title" >${title}</h5>
                        </div>
                        <div class="modal-body" >
                            <div class="d-flex align-items-center">
                                <label>${message}</label>
                                <div class="${localForm} ${localColor}" role="status" aria-hidden="false">
                                </div>
                            </div>
                        </div>
                   </div>
              </div>
           </div>`;

            const parent = (<HTMLDivElement>document.getElementById(this.alertId));
            if (parent) {
                this.clearModalChildren(this.alertId);
                var child = this.htmlToElement(modalContent) as HTMLDivElement;
                if (child) {
                    child.style.display = "block";
                    child.style.paddingRight = "17px";
                    child.className = "modal fade show";
                    document.body.className = "modal-open";
                    var div: HTMLDivElement = <HTMLDivElement>document.createElement('div');
                    if (div) {
                        div.className = "modal-backdrop fade show";
                        document.body.appendChild(div);
                    }
                    parent.appendChild(child);
                }
            }
            if (timeout > 0) {
                setTimeout(() => { this.hideProgress(); }, timeout);
            }
            return true;
        }
        return false;
    }
    hideProgress(){
        return this.hideAlert();
    }

}

export class Toast extends Alert{
    constructor(alertId: string) {
      super(alertId);
    }

    showToast(title: string, message: string, time: string, timeout: number = 0): boolean {

        if (!isNullOrUndefinedOrEmpty(this.alertId)) {
            var modalContent: string = `<div id="toastdiv" aria-live="polite" aria-atomic="true" style="position: relative; min-height: 300px;">
            <div style="position: absolute; top: 0; right: 0;">
              <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                  <img src="favicon.svg" class="rounded mr-2" alt="favicon.svg">
                  <strong class="mr-auto">${title}</strong>
                  <small class="text-muted">${time}</small>
                  <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div class="toast-body">
                ${message}
                </div>
              </div>
            </div>
          </div>`;

            const div = (<HTMLDivElement>document.getElementById(this.alertId));
            if(div){
              const parent = div.parentElement;
              if (parent) {
                  this.clearToastChildren(this.alertId);
                  var child = this.htmlToElement(modalContent) as HTMLDivElement;
                  if (child) {
                      parent.appendChild(child);
                  }
              }
              var option = { delay: timeout, autohide: true, animation: true};
              $('.toast').toast(option);
              $('.toast').toast('show');
              return true;
            }
        }
        return false;
    }
    hideToast(){
      $('.toast').toast('hide');
      return this.hideAlert();
    }
    protected clearToastChildren(id: string) {
      const div = (<HTMLDivElement>document.getElementById("toastdiv"));
      if((div)&&(div.parentElement))
        div.parentElement.removeChild(div);
    }
}



export class PageWaiting {
    id: string;
    constructor(id: string) {
        this.id = id;
    }
    show(text: string | null = null, form: WaitCursorForm = WaitCursorForm.border, color: WaitCursorColor|null = null):void {
      var localForm = "spinner-border";
      var localColor = "mini-text-color-blue";
      if (form) {
        if (form == WaitCursorForm.border)
          localForm = "spinner-border";
        else if (form == WaitCursorForm.grow)
          localForm = "spinner-grow";
      }
      if (color) {
        if (color == WaitCursorColor.blue)
          localColor = "mini-text-color-blue";
        else if (color == WaitCursorColor.dark)
          localColor = "mini-text-color-dark";
        else if (color == WaitCursorColor.green)
          localColor = "mini-text-color-green";
        else if (color == WaitCursorColor.light)
          localColor = "mini-text-color-light";
        else if (color == WaitCursorColor.orange)
          localColor = "mini-text-color-orange";
        else if (color == WaitCursorColor.purple)
          localColor = "mini-text-color-purple";
        else if (color == WaitCursorColor.red)
          localColor = "mini-text-color-red";
        else if (color == WaitCursorColor.yellow)
          localColor = "mini-text-color-yellow";
      }
  
      if (this.id) {
        var div = <HTMLDivElement>document.getElementById(this.id);
        if ((!isNullOrUndefined(div)) && (!isNullOrUndefined(div.parentElement))) {
          var subdiv: HTMLDivElement = (<HTMLDivElement>document.createElement('DIV'));
          if (subdiv) {
            subdiv.classList.add("d-flex");
            subdiv.classList.add("align-items-center");
            if (text) {
              var subtext: HTMLElement = (<HTMLElement>document.createElement('Label'));
              if (subtext) {
                subtext.innerHTML = text;
                subdiv.appendChild(subtext);
              }
            }
            var spindiv: HTMLDivElement = (<HTMLDivElement>document.createElement('DIV'));
            if (spindiv) {
              spindiv.classList.add(localForm);
              //spindiv.classList.add("ml-auto");
              if(color)
                spindiv.classList.add(localColor);
              else
                spindiv.classList.add("mini-spinner");
              spindiv.setAttribute("role", "status");
              spindiv.setAttribute("aria-hidden", "false");
              subdiv.appendChild(spindiv);
            }
            if (div.parentElement)
              div.parentElement.appendChild(subdiv);
          }
        }
      }
    }
    hide():void {
      if (this.id) {
        var div = <HTMLDivElement>document.getElementById(this.id);
        if ((!isNullOrUndefined(div)) && (!isNullOrUndefined(div.parentElement))) {
          if ((div) && (div.parentElement)) {
            var col: HTMLCollection = div.parentElement.getElementsByClassName("d-flex align-items-center");
            if (col) {
              div.parentElement.removeChild(col[0]);
            }
          }
        }
      }
    }
}
export class ButtonWaiting {
    id: string;
    constructor(id: string) {
        this.id = id;
    }
    show(text: string | null = null, form: WaitCursorForm | null = null, color: WaitCursorColor | null = null):void {
      var localForm = "spinner-border";
      //var localColor = "mini-button-text-color";
      var localColor = "";
      if (form) {
        if (form == WaitCursorForm.border)
          localForm = "spinner-border";
        else if (form == WaitCursorForm.grow)
          localForm = "spinner-grow";
      }
      if (color) {
        if (color == WaitCursorColor.blue)
          localColor = "mini-text-color-blue";
        else if (color == WaitCursorColor.dark)
          localColor = "mini-text-color-dark";
        else if (color == WaitCursorColor.green)
          localColor = "mini-text-color-green";
        else if (color == WaitCursorColor.light)
          localColor = "mini-text-color-light";
        else if (color == WaitCursorColor.orange)
          localColor = "mini-text-color-orange";
        else if (color == WaitCursorColor.purple)
          localColor = "mini-text-color-purple";
        else if (color == WaitCursorColor.red)
          localColor = "mini-text-color-red";
        else if (color == WaitCursorColor.yellow)
          localColor = "mini-text-color-yellow";
      }
  
      if (this.id) {
        var button = <HTMLButtonElement>document.getElementById(this.id);
        if (button) {
          var span: HTMLSpanElement = (<HTMLDivElement>document.createElement('SPAN'));
          if (span) {
            span.classList.add(localForm);
            span.classList.add(localForm + "-sm");
            if (!isNullOrUndefinedOrEmpty(localColor))
              span.classList.add(localColor);
            span.classList.add("mini-button-spinner");
            span.setAttribute("role", "status");
            span.setAttribute("aria-hidden", "false");
            button.insertBefore(span, null);
          }
        }
      }
    }
    hide():void {
      if (this.id) {
        var button = <HTMLButtonElement>document.getElementById(this.id);
        if (button) {
          var colborder: HTMLCollection = button.getElementsByClassName("spinner-border");
          if ((colborder) && (colborder.length > 0)) {
            button.removeChild(colborder[0]);
          }
          var colgrow: HTMLCollection = button.getElementsByClassName("spinner-grow");
          if ((colgrow) && (colgrow.length > 0)) {
            button.removeChild(colgrow[0]);
          }
        }
      }
    }
  }
  