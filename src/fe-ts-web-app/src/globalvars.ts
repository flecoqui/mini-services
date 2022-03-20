class GlobalVariables {
  private globalLanguage: string = "en";
  private globalColor: string = "blue";
  private globalCache: boolean = true;
  private globalPageSize: number = 10;
  public getGlobalPageSize(): number {
    if (typeof (Storage) !== "undefined") {
      var l = localStorage.getItem("miniwebapp-pagesize")
      if (l){
        var value = Number.parseInt(l);
        this.setGlobalPageSize(value)
      }
    }
    return this.globalPageSize;
  };
  public setGlobalPageSize(value: number) {
    if (typeof (Storage) !== "undefined")
      localStorage.setItem("miniwebapp-pagesize", value.toString());
    this.globalPageSize = value;
  };

  public getGlobalCache(): boolean {
    if (typeof (Storage) !== "undefined") {
      var l = localStorage.getItem("miniwebapp-cache")
      if (l){
        var value = JSON.parse(l); 
        this.setGlobalCache(value)
      }
    }
    return this.globalCache;
  };
  public setGlobalCache(value: boolean) {
    if (typeof (Storage) !== "undefined")
      localStorage.setItem("miniwebapp-cache", value.toString());
    this.globalCache = value;
  };

  public getGlobalLanguage(): string {
    if (typeof (Storage) !== "undefined") {
      var l = localStorage.getItem("miniwebapp-language")
      if (l)
        this.setGlobalLanguage(l)
    }
    return this.globalLanguage;
  };
  public getGlobalColor(): string {
    if (typeof (Storage) !== "undefined") {
      var c = localStorage.getItem("miniwebapp-color")
      if (c)
        this.setGlobalColor(c)
    }
    return this.globalColor;
  };
  public setGlobalLanguage(value: string) {
    if (typeof (Storage) !== "undefined")
      localStorage.setItem("miniwebapp-language", value);
    this.globalLanguage = value;
  };
  protected stringsMap: Map<string, Map<string, string>> = new Map<string, Map<string, string>>([
  ])
  public setStringMap(lang: string, map: Map<string, string>) {
    this.stringsMap.set(lang, map);
  }
  public getCurrentString(id: string): string {
    var localStrings = this.stringsMap.get(this.getGlobalLanguage());
    if (localStrings) {
      var s = localStrings.get(id);
      if (s) {
        return s;
      }
    }
    return id;
  }
  public setGlobalColor(value: string) {
    if (typeof (Storage) !== "undefined")
      localStorage.setItem("miniwebapp-color", value);
    this.globalColor = value;
  };
  public clearData() {
    if (typeof (Storage) !== "undefined") {
      localStorage.removeItem("miniwebapp-language");
      localStorage.removeItem("miniwebapp-color");
    }
  }
}

declare var globalVars: GlobalVariables;
globalThis.globalVars = new GlobalVariables();

