const { AddonManager } = require('resource://gre/modules/AddonManager.jsm');
const { Panel: panel } = require('sdk/panel');
const self = require('sdk/self');
const simplePrefs = require('sdk/simple-prefs');
const simpleStorage = require('sdk/simple-storage');
const tabs = require('sdk/tabs');
const { viewFor } = require('sdk/view/core');

const { Button } = require('lib/Button.js');
const { TelemetryLog } = require('lib/TelemetryLog.js');

const panelWidth = 402;
const panelRecHeight = 100;
const welcomeBoxHeight = 70;
const footerHeight = 42;

class Recommender {
  constructor() {
    const methodsToBind = ['endOnboard', 'showPanel', 'waitForWindow',
                           'handlePanelHide', 'hidePanel'];
    for (let key of methodsToBind) { // eslint-disable-line prefer-const
      this[key] = this[key].bind(this);
    }
    this.installedAddonIds = new Set();
    this.buttons = [];
    this.panel = this.createPanel();
    this.createRequestListener('install');
    this.createRequestListener('uninstall');
    this.createRequestListener('info');
    this.createRequestListener('disableSite');
    this.createRequestListener('disableForever');
    this.createWindowListeners();
  }

  start() {
    this.populateInstallSet();
    if (!simpleStorage.storage.recData) {
      simpleStorage.storage.recData = this.loadLocalRecs();
    }
    this.activeRecDomain = '';
    if (!simplePrefs.prefs.onboarded) {
      this.onboard();
    }
  }

  destroy() {
    this.panel.destroy();
    this.removeWindowListener();
    this.deleteButtons();
  }

  onboard() {
    this.panel.port.emit('onboard');
    tabs.open({
      url: 'https://weather.com',
      onReady: () => {
        const win = tabs.activeTab.window;
        const button = this.getButton(win);
        this.showPanel(button);
        TelemetryLog.onboard();
        this.panel.on('hide', this.endOnboard);
      },
    });
  }

  endOnboard() {
    this.panel.removeListener('hide', this.endOnboard);
    this.panel.port.emit('endOnboard');
    TelemetryLog.endOnboard();
    simplePrefs.prefs.onboarded = true;
    this.waitForWindow(); // reset the panel size
  }

  createPanel() {
    return panel({
      width: panelWidth,
      height: panelRecHeight + footerHeight,
      contentURL: './recommendation/recWindow.html',
      contentScriptFile: './recommendation/notify.js',
      onHide: this.handlePanelHide,
    });
  }

  showPanel(button) {
    TelemetryLog.showPanel();
    button.handlePanelOpen();
    this.panel.show({
      position: button,
    });
  }

  handlePanelHide() {
    const win = tabs.activeTab.window;
    const button = this.getButton(win);
    button.handlePanelHide();
  }

  // Prepares panel with info in background
  prepPanel(recs) {
    this.recs = this.checkForInstalled(recs);
    this.panel.height = recs.length * panelRecHeight + footerHeight;
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
    const markedRecs = recs;
    for (let rec of markedRecs) { // eslint-disable-line prefer-const
      if (this.installedAddonIds.has(rec.id)) {
        rec.isInstalled = true;
      } else {
        rec.isInstalled = false;
      }
    }
    return markedRecs;
  }

  getButton(win) {
    for (let button of this.buttons) { // eslint-disable-line prefer-const
      if (button.window === win) {
        return button;
      }
    }
    // if a button doesn't exist, make a new one
    const button = new Button(viewFor(win), this.showPanel);
    button.window = win;
    this.buttons.push(button);
    return button;
  }

  deleteButtons() {
    for (let button of this.buttons) { // eslint-disable-line prefer-const
      button.destroy();
    }
    this.buttons = [];
  }

  // Checks that current window is target domain
  waitForWindow() {
    const win = tabs.activeTab.window;
    const button = this.getButton(win);
    for (let rec of simpleStorage.storage.recData) { // eslint-disable-line prefer-const
      if (tabs.activeTab.url.includes(rec.domain)) {
        this.activeRecDomain = rec.domain;
        this.prepPanel(rec.data);
        TelemetryLog.showButton();
        button.show();
        if (simplePrefs.prefs.autoOpenPanel && !rec.shown) {
          this.showPanel(button);
          rec.shown = true;
        }
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
        TelemetryLog.install();
        this.installAddon(data.packageURL);
      });
    } else if (request === 'uninstall') {
      this.panel.port.on(request, data => {
        this.uninstallAddon(data.id, data.packageURL);
      });
    } else if (request === 'info') {
      this.panel.port.on(request, data => {
        this.panel.hide();
        tabs.open(data.infoURL);
      });
    } else if (request === 'disableSite') {
      this.panel.port.on(request, () => {
        this.panel.hide();
        const win = tabs.activeTab.window;
        const button = this.getButton(win);
        button.hide();
        for (let i = 0; i < simpleStorage.storage.recData.length; i++) {
          if (simpleStorage.storage.recData[i].domain === this.activeRecDomain) {
            simpleStorage.storage.recData.splice(i, 1);
            return;
          }
        }
      });
    } else if (request === 'disableForever') {
      this.panel.port.on(request, () => {
        this.panel.hide();
        const win = tabs.activeTab.window;
        const button = this.getButton(win);
        button.hide();
        simpleStorage.storage.recData = []; // clear all recs
        this.uninstallAddon(self.id, '');
      });
    }
  }

  hidePanel() {
    this.panel.hide();
  }

  createWindowListeners() {
    tabs.on('activate', this.waitForWindow);
    tabs.on('ready', this.waitForWindow);
    tabs.on('deactivate', this.hidePanel);
  }

  removeWindowListener() {
    tabs.off('activate', this.waitForWindow);
    tabs.off('ready', this.waitForWindow);
    tabs.off('deactivate', this.hidePanel);
  }

  loadLocalRecs() {
    const recs = self.data.load('recommendation/localData.json');
    return JSON.parse(recs);
  }
}

exports.Recommender = Recommender;
