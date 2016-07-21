const { AddonManager } = require('resource://gre/modules/AddonManager.jsm');
const { Panel: panel } = require('sdk/panel');
const sdkData = require('sdk/self').data;
const simplePrefs = require('sdk/simple-prefs');
const tabs = require('sdk/tabs');
const { viewFor } = require('sdk/view/core');

const { Button } = require('lib/Button.js');

const panelWidth = 402;
const panelRecHeight = 102;
const welcomeBoxHeight = 67;

class Recommender {
  constructor() {
    this.installedAddonIds = new Set();
    this.recData = [];
    this.buttons = [];
  }
  init() {
    this.panel = this.createPanel();
    this.createRequestListener('install');
    this.createRequestListener('uninstall');
    this.populateInstallSet();
    this.loadLocalRecs();
    this.createWindowListener();
    if (!simplePrefs.prefs.onboarded) {
      this.onboard();
    }
  }

  destroy() {
    this.panel.destroy();
    this.buttonManager.deleteButtons();
    this.removeWindowListener();
  }

  onboard() {
    this.panel.port.emit('onboard');
    tabs.open({
      url: 'https://wikipedia.org',
      onReady: () => {
        this.showPanel();
        this.panel.on('hide', this.endOnboard.bind(this));
      },
    });
  }

  endOnboard() {
    this.panel.removeListener('hide', this.endOnboard.bind(this));
    this.panel.port.emit('endOnboard');
    simplePrefs.prefs.onboarded = true;
    this.waitForWindow(); // reset the panel size
  }

  createPanel() {
    return panel({
      width: panelWidth,
      height: panelRecHeight,
      contentURL: './recommendation/recWindow.html',
      contentScriptFile: './recommendation/notify.js',
    });
  }

  showPanel(button) {
    this.panel.show({
      position: button,
    });
  }

  // Prepares panel with info in background
  prepPanel(recs) {
    this.checkForInstalled(recs);
    this.panel.height = recs.length * panelRecHeight;
    if (!simplePrefs.prefs.onboarded) {
      this.panel.height += welcomeBoxHeight;
    }
    this.panel.port.emit('data', recs);
  }

  // adds all installed addon names to global set "installedAddons"
  populateInstallSet() {
    this.installedAddonIds.clear(); // to remove recently uninstalled addons
    AddonManager.getAllAddons(addons => {
      for (let addon of addons) { // eslint-disable-line prefer-const
        this.installedAddonIds.add(addon.id);
      }
    });
  }

  // checks to see if any recommendations are already installed
  checkForInstalled(recs) {
    for (let rec of recs) { // eslint-disable-line prefer-const
      if (this.installedAddonIds.has(rec.id)) {
        rec.isInstalled = true;
      } else {
        rec.isInstalled = false;
      }
    }
  }

  getButton(win) {
    for (let button of this.buttons) { // eslint-disable-line prefer-const
      if (button.window === win) {
        return button;
      }
    }
    // if a button doesn't exist, make a new one
    const button = new Button(viewFor(win), this.showPanel.bind(this));
    button.window = win;
    this.buttons.push(button);
    return button;
  }

  // Checks that current window is target domain
  waitForWindow() {
    const win = tabs.activeTab.window;
    const button = this.getButton(win);
    for (let rec of this.recData) { // eslint-disable-line prefer-const
      if (tabs.activeTab.url.includes(rec.domain)) {
        this.prepPanel(rec.data);
        button.show();
        return;
      }
    }
    // only reached if no rec.domain matches current tab domain
    button.hide();
  }

  installAddon(url) {
    AddonManager.getInstallForURL(url, installObject => {
      installObject.install();
      installObject.addListener({
        onInstallEnded: () => {
          this.populateInstallSet();
          const successMessage = `install${url}`;
          this.panel.port.emit(successMessage);
        },
      });
    }, 'application/x-xpinstall');
  }

  uninstallAddon(id, url) {
    AddonManager.getAddonByID(id, addon => {
      addon.uninstall();
      this.populateInstallSet();
      const successMessage = `uninstall${url}`;
      this.panel.port.emit(successMessage);
    });
  }

  createRequestListener(request) {
    if (request === 'install') {
      this.panel.port.on(request, data => {
        this.installAddon(data.packageURL);
      });
    } else if (request === 'uninstall') {
      this.panel.port.on(request, data => {
        this.uninstallAddon(data.id, data.packageURL);
      });
    }
  }

  createWindowListener() {
    tabs.on('activate', this.waitForWindow.bind(this));
    tabs.on('ready', this.waitForWindow.bind(this));
  }

  removeWindowListener() {
    tabs.off('activate', this.waitForWindow.bind(this));
    tabs.off('ready', this.waitForWindow.bind(this));
  }

  addRecommendation(domain, data) {
    const rec = { domain, data };
    this.recData.push(rec);
  }

  loadLocalRecs() {
    let recs = sdkData.load('recommendation/localData.json');
    recs = JSON.parse(recs);
    for (let rec of recs) { // eslint-disable-line prefer-const
      this.addRecommendation(rec.domain, rec.data);
    }
  }
}

const recommender = new Recommender();

exports.Recommend = {
  start() {
    recommender.init();
  },
  destroy() {
    recommender.destroy();
  },
};
