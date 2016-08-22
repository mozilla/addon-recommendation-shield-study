const { AddonManager } = require('resource://gre/modules/AddonManager.jsm');
const { Panel: panel } = require('sdk/panel');
const self = require('sdk/self');
const sdkUrl = require('sdk/url');
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
const onboardDomain = 'https://wikipedia.org';

class Recommender {
  constructor() {
    this.telemetryLog = new TelemetryLog();
    const methodsToBind = ['endOnboard', 'showPanel', 'waitForWindow',
                           'handlePanelHide', 'handlePanelShow', 'hidePanel'];
    for (let key of methodsToBind) { // eslint-disable-line prefer-const
      this[key] = this[key].bind(this);
    }
    this.installedAddonIds = new Set();
    this.buttons = [];
    this.panel = this.createPanel();
    this.createRequestListeners();
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
      url: onboardDomain,
      onReady: () => {
        this.telemetryLog.onboard(onboardDomain);
        this.panel.on('hide', this.endOnboard);
      },
    });
  }

  endOnboard() {
    this.panel.removeListener('hide', this.endOnboard);
    this.panel.port.emit('endOnboard');
    this.telemetryLog.endOnboard();
    simplePrefs.prefs.onboarded = true;
    this.waitForWindow(); // reset the panel size
  }

  createPanel() {
    return panel({
      width: panelWidth,
      height: panelRecHeight + footerHeight,
      contentURL: './recommendation/recWindow.html',
      contentScriptFile: './recommendation/notify.js',
      onShow: this.handlePanelShow,
      onHide: this.handlePanelHide,
    });
  }

  showPanel(button) {
    button.handlePanelOpen();
    this.panel.show({
      position: button,
    });
  }

  handlePanelShow() {
    this.telemetryLog.showPanel(this.activeRecDomain);
  }

  handlePanelHide() {
    this.telemetryLog.hidePanel(this.activeRecDomain);
    const win = tabs.activeTab.window;
    const button = this.getButton(win);
    button.handlePanelHide();
  }

  // Prepares panel with info in background
  prepPanel(recs) {
    const markedRecs = this.checkForInstalled(recs);
    this.panel.height = recs.length * panelRecHeight + footerHeight;
    if (!simplePrefs.prefs.onboarded) {
      this.panel.height += welcomeBoxHeight;
    }
    this.panel.port.emit('data', markedRecs);
    return markedRecs;
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

  allInstalledAlready(markedRecs) {
    return markedRecs.filter((rec) => !rec.isInstalled).length === 0;
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

  offerRecommendation(button, rec) {
    this.telemetryLog.showButton(this.activeRecDomain);
    button.show();
    if (!simplePrefs.prefs.onboarded) {
      this.showPanel(button);
    }
    if (simplePrefs.prefs.autoOpenPanel && !rec.shown) {
      this.showPanel(button);
    }
  }

  // Checks that current window is target domain
  waitForWindow() {
    const win = tabs.activeTab.window;
    const button = this.getButton(win);
    const tabHostname = sdkUrl.URL(tabs.activeTab.url).hostname; // eslint-disable-line new-cap
    for (let rec of simpleStorage.storage.recData) { // eslint-disable-line prefer-const
      if (tabHostname === rec.domain) {
        this.activeRecDomain = rec.domain;
        const markedRecs = this.prepPanel(rec.data);
        if (!this.allInstalledAlready(markedRecs) || !simplePrefs.prefs.onboarded) {
          this.offerRecommendation(button, rec);
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

  createRequestListeners() {
    this.createInstallListener();
    this.createUninstallListener();
    this.createInfoListener();
    this.createWhyListener();
    this.createDisableSiteListener();
    this.createDisableForeverListener();
  }

  createInstallListener() {
    this.panel.port.on('install', data => {
      this.telemetryLog.install(data);
      this.installAddon(data.packageURL);
    });
  }

  createUninstallListener() {
    this.panel.port.on('uninstall', data => {
      this.uninstallAddon(data.id, data.packageURL);
    });
  }

  createInfoListener() {
    this.panel.port.on('info', data => {
      this.panel.hide();
      tabs.open(data.infoURL);
    });
  }

  createWhyListener() {
    this.panel.port.on('why', () => {
      this.telemetryLog.whyButtonClicked(this.activeRecDomain);
    });
  }

  createDisableSiteListener() {
    this.panel.port.on('disableSite', () => {
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
  }

  createDisableForeverListener() {
    this.panel.port.on('disableForever', () => {
      this.panel.hide();
      const win = tabs.activeTab.window;
      const button = this.getButton(win);
      button.hide();
      simpleStorage.storage.recData = []; // clear all recs
      this.uninstallAddon(self.id, '');
    });
  }

  hidePanel() {
    this.panel.hide();
  }

  createWindowListeners() {
    tabs.on('activate', this.waitForWindow);
    tabs.on('pageshow', this.waitForWindow);
    tabs.on('deactivate', this.hidePanel);
    tabs.on('close', this.hidePanel);
  }

  removeWindowListener() {
    tabs.off('activate', this.waitForWindow);
    tabs.off('pageshow', this.waitForWindow);
    tabs.off('deactivate', this.hidePanel);
    tabs.off('close', this.hidePanel);
  }

  loadLocalRecs() {
    const recs = self.data.load('recommendation/localData.json');
    return JSON.parse(recs);
  }
}

exports.Recommender = Recommender;
