import { IDialog, EndDialogCallback } from "./idialog";
import { isNullOrUndefinedOrEmpty, isNullOrUndefined, getFileContentAsync } from "./common";
import "bootstrap";
import "bootstrap-table";

let $: JQueryStatic = (window as any)["jQuery"];
/**
 * ITableColumn
 */
export interface ITableColumn {
  title: string;
  field: string;
}
/**
 * Table
 */
export class Table  {
  tableId: string = "";
  tableLoaded: boolean = false;
  pageSize: number;

  constructor(id: string) {
    this.tableId = id;
    this.tableLoaded = false;
    this.pageSize = 10;
  }
  setColumns(columns: Array<ITableColumn>){
    var $table = $(`#${this.tableId}`);
    $table.bootstrapTable({
    columns: columns
    });
  }
  destroyTable(){
    var $table = $(`#${this.tableId}`);
    $table.bootstrapTable('destroy'); 
  }
  createTableHeader(columns: Array<ITableColumn>|null=null){
    if(columns){
      var table = document.getElementById(this.tableId);
      if (table == null)
        return;
  
      while (table.hasChildNodes()) {
        if (table.firstChild != null)
          table.removeChild(table.firstChild);
      }
      var colArray = ['path', 'size', 'status', ""];
      // create header
      var tableHeader = document.createElement('THEAD');
      table.appendChild(tableHeader);
      var trHeader = document.createElement('TR');
      tableHeader.appendChild(trHeader);
      for (var i = 0; i < columns.length; i++) {
        var th = document.createElement('TH');
        if(isNullOrUndefinedOrEmpty(columns[i].field)){
          th.appendChild(document.createTextNode(columns[i].title));
          th.setAttribute("data-checkbox","true");
        }
        else{
          th.appendChild(document.createTextNode(columns[i].title));
          th.setAttribute("data-sortable","true");
          th.setAttribute("data-field",columns[i].field);
        }
        trHeader.appendChild(th);
      }      
    }
  }
  createTable(columns: Array<ITableColumn>|null=null, pageSize: number,  key: string, buttonArray: string[]): boolean {
    this.createTableHeader(columns);
    var $table = $(`#${this.tableId}`);
    this.pageSize = pageSize;
    // Set Pagination Size 
    $table.attr("data-page-size",this.pageSize);
    // Set Table data properties
    $table.attr("data-pagination","true");
    $table.attr("data-search","true");  
    $table.attr("data-resizable","true");    
    // Detect when table is loaded
    $table.on('post-body.bs.table',  (e, row) => {
        this.tableLoaded = true;
    });
    // Event on row checkbox
    $table.on('check.bs.table', function (e, row) {
      var array = $table.bootstrapTable('getSelections');
      if ((array) && (array.length)) {
        for (var i = 0; i < array.length; i++) {
          if (array[i].id != row.id)
            $table.bootstrapTable('uncheckBy', { field: key, values: [array[i][key]] });
        }
      }
      var select = !$table.bootstrapTable('getSelections').length;
      for(var i=0; i < buttonArray.length; i++){
        var $btn = $(`#${buttonArray[i]}`);
        $btn.prop('disabled', select);
      }
    })
    $table.on('uncheck.bs.table', function (e, row) {
      var select = !$table.bootstrapTable('getSelections').length;
      for(var i=0; i < buttonArray.length; i++){
        var $btn = $(`#${buttonArray[i]}`);
        $btn.prop('disabled', select);
      }
    })

    return true;
  }
  fillTable(payload: any): boolean {
    var $table = $(`#${this.tableId}`);
    if (this.tableLoaded != true) {
      (<any>$table).bootstrapTable(
        {
          data: payload,
          locale: globalThis.globalVars.getGlobalLanguage(),
          onPageChange:  (pagenumber: number, pagesize: number) => {
            this.hidePaginationDropDown();                    
          }
        });
    }
    else {
      // $table.bootstrapTable('removeAll');
      $table.bootstrapTable(
        'load',
        payload
      );
    }
    // Add background color 
    $(`#${this.tableId} th`).addClass("mini-table-header");
    // Hide select all checkbox 
    var todoTable = document.getElementById("todoTableId");
    if (todoTable) {
      var checkboxes = (<NodeListOf<HTMLInputElement>>document.getElementsByName("btSelectAll"));
      for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].classList.add("d-none");      
      }
    }
    // Hide pagination drop down
    this.hidePaginationDropDown();

    return true;
  }
  getSelection(): any {
    var $table = $(`#${this.tableId}`);
    return $table.bootstrapTable('getSelections');
  }
  selectRow(fieldId: string, fieldValue: string){
    var $table = $(`#${this.tableId}`);
    if(!isNullOrUndefinedOrEmpty(fieldValue)){
      if ($table) {
        $table.bootstrapTable('checkBy', { field: fieldId, values: [fieldValue] });
        return true;
      }
    }
    return false;
  }

  protected hidePaginationDropDown(){
    var collection = document.getElementsByClassName("page-list");
    if ((collection)&&(collection.length)) {
      for (var i = 0; i < collection.length; i++) {
        collection[i].classList.add("d-none");      
      }
    }
  }
}
