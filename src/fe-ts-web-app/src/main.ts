import './globalconfig';
import './globalclient';
import { isNullOrUndefinedOrEmpty, isNullOrUndefined, isEmpty } from "./common";
import { StorageClient } from "./storage";
import { NavigationManager, PageConfiguration } from "./navmanager";
import { APIClient } from './apiclient';

// Get global configuration
const globalConfig = globalThis.globalConfiguration;

// Initialize azureADClient used for the authentication
const azureADClient = globalThis.globalClient.getAzureADClient();

// Initialize the StorageClient used for the access to Azure Storage
const storageClient = globalThis.globalClient.getStorageClient();

// Initialize APIClient
const apiClient = globalThis.globalClient.getAPIClient();


var manager: NavigationManager = new NavigationManager();

function openPage(nav: NavigationManager, pageId: string) {
  console.log(`Opening page: ${pageId}`)
  nav.selectPage(pageId);
}
const connectedPages: Array<string> = ["home", "todo", "settings", "signout", "tests"];
const offlinePages: Array<string> = ["home", "settings", "signin", "tests"];
function isPageVisible(nav: NavigationManager, pageId: string): boolean {
  //console.log(`Checking if page ${pageId} will be visible`)
  if (azureADClient.isConnected()) {
    if (connectedPages.includes(pageId)) {
      //console.log(`Page ${pageId} is visible`)
      return true;
    }
  }
  else {
    if (offlinePages.includes(pageId)) {
      //console.log(`Page ${pageId} is visible`)
      return true;
    }
  }
  //console.log(`Page ${pageId} is not visible`)
  return false;
}

async function signIn(nav: NavigationManager, pageId: string) {
  console.log(`SignIn: ${pageId}`)
  await manager.selectPage(pageId);
  try {
    let account = await azureADClient.signInAsync();
    if (account) {
      await manager.selectPage("home");
    }
    else {
      var error = "Authentication failed"
      console.log(`Error while calling signIn: ${error}`)
      await manager.selectPage("home");
    }
  }
  catch (e) {
    console.log(`Exception while calling signIn: ${e}`)
    await manager.selectPage("home");
  }
}

async function signOut(nav: NavigationManager, pageId: string) {
  console.log(`SignOut: ${pageId}`)
  await manager.selectPage(pageId);
  await azureADClient.signOutAsync();
  if (azureADClient.isConnected() == false) {
    await manager.selectPage("home");
  }
}

var pageConfiguration: Array<PageConfiguration> = [
  {
    pageId: "home",
    pageTitle: "Home",
    pageHTMLUri: "home.html",
    pageJavascriptUri: "home-bundle.js",
    pageNavigateFunction: openPage,
    pageConditionFunction: isPageVisible
  },
  {
    pageId: "todo",
    pageTitle: "ToDo",
    pageHTMLUri: "todo.html",
    pageJavascriptUri: "todo-bundle.js",
    pageNavigateFunction: openPage,
    pageConditionFunction: isPageVisible
  },
  {
    pageId: "settings",
    pageTitle: "Settings",
    pageHTMLUri: "settings.html",
    pageJavascriptUri: "settings-bundle.js",
    pageNavigateFunction: openPage,
    pageConditionFunction: isPageVisible
  },
  {
    pageId: "signin",
    pageTitle: "SignIn",
    pageHTMLUri: null,
    pageJavascriptUri: null,
    pageNavigateFunction: signIn,
    pageConditionFunction: isPageVisible
  },
  {
    pageId: "signout",
    pageTitle: "SignOut",
    pageHTMLUri: null,
    pageJavascriptUri: null,
    pageNavigateFunction: signOut,
    pageConditionFunction: isPageVisible
  },
  {
    pageId: "tests",
    pageTitle: "Tests",
    pageHTMLUri: "tests.html",
    pageJavascriptUri: "tests-bundle.js",
    pageNavigateFunction: openPage,
    pageConditionFunction: isPageVisible
  }
];

var result = manager.initialization(
  "navbarsExampleDefault",
  "mediaburgerbutton",
  "content",
  globalThis.globalVars.getGlobalLanguage(),
  globalThis.globalVars.getGlobalColor(),
  pageConfiguration
);

if (result == true) {
  manager.navigate();
}
else {
  console.log("Error while initializing navigation manager");
}
