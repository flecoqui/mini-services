import './globalconfig';
import { isNullOrUndefinedOrEmpty } from "./common";

const globalConfig = globalThis.globalConfiguration;
if (globalConfig) {
  //console.log("Reading globalConfig")

  var s = document.getElementById('versionButton');
  if (s) {
    //console.log(`versionButton set to ${globalConfig.version}`);
    s.innerHTML = globalConfig.version;
  }
  else
    console.log("Error: versionButton not defined");
}
else
  console.log("Error: getGlobalConfiguration not defined");
