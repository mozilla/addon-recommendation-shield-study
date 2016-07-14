const { Cu } = require('chrome');
Cu.import('resource://gre/modules/Services.jsm'); /* globals Services: false */

const { AddonManager } = require('resource://gre/modules/AddonManager.jsm');
const { Panel: panel } = require('sdk/panel');
const simplePrefs = require('sdk/simple-prefs');
const sdkData = require('sdk/self').data;
const tabs = require('sdk/tabs');

const panelWidth = 402;
const panelRecHeight = 102;

class Recommender {
  constructor() {
    this.doc = Services.wm.getMostRecentWindow('navigator:browser').document;
    this.installedAddonIds = new Set();
    this.recData = [];
  }

  start() {
    this.createPanel();
    this.createButton();
    this.createRequestListener('install');
    this.createRequestListener('uninstall');
    this.createWindowListener();
    this.populateInstallSet();
    this.loadLocalRecs();
  }

  destroy() {
    this.destroyPanel();
    this.destroyButton();
    this.removeWindowListener();
  }

  createPanel() {
    this.panel = panel({
      width: panelWidth,
      height: panelRecHeight,
      contentURL: './recommendation/recWindow.html',
      contentScriptFile: './recommendation/notify.js',
    });
  }

  destroyPanel() {
    this.panel.destroy();
  }

  createButton() {
    this.button = this.doc.createElement('div');
    this.button.id = 'recommend-button';
    this.buttonMessage = this.doc.createElement('div');
    this.buttonMessageIcon = this.doc.createElement('image');
    this.buttonMessageIcon.setAttribute('src', sdkData.url('recommendation/firefox.svg'));
    this.buttonMessageIcon.setAttribute('class', 'urlbar-icon');
    this.buttonMessage.appendChild(this.buttonMessageIcon);
    this.buttonMessageText = this.doc.createElement('h1');
    this.buttonMessage.appendChild(this.buttonMessageText);
    this.buttonMessage.style.background = 'linear-gradient(#67CD45, #00a920)';
    this.buttonMessage.style.padding = '2px 8px 2px 0';
    this.buttonMessage.style['border-radius'] = '15px';
    this.buttonMessage.style.color = 'white';
    this.buttonMessage.style['box-shadow'] = '0 1px 2px -2px #6A6A6A';
    this.button.appendChild(this.buttonMessage);
    this.buttonImg = this.doc.createElement('image');
    this.buttonImg.setAttribute('class', 'urlbar-icon');
    this.button.appendChild(this.buttonImg);
    this.button.setAttribute('hidden', 'true');
    this.doc.getElementById('urlbar-icons').appendChild(this.button);

    this.button.addEventListener('click', this.showPanel.bind(this));
    this.setButton();
    this.watchButtonPrefs();
  }

  destroyButton() {
    this.button.remove();
  }

  setButton() {
    this.useTextButton = simplePrefs.prefs.useTextButton;
    if (this.useTextButton) {
      this.setButtonText();
      this.buttonImg.setAttribute('hidden', 'true');
      this.buttonMessage.setAttribute('hidden', 'false');
    } else {
      this.setButtonImg();
      this.buttonMessage.setAttribute('hidden', 'true');
      this.buttonImg.setAttribute('hidden', 'false');
    }
  }

  setButtonText() {
    const customText = simplePrefs.prefs.customButtonText;
    if (customText !== undefined && customText !== '') {
      this.buttonMessageText.innerHTML = customText;
    } else {
      this.buttonMessageText.innerHTML = 'See Recommended Add-ons';
    }
  }

  setButtonImg() {
    const customImgURL = simplePrefs.prefs.customButtonImgURL;
    if (customImgURL !== undefined && customImgURL !== '') {
      this.buttonImg.setAttribute('src', customImgURL);
    } else {
      this.buttonImg.setAttribute('src', sdkData.url('recommendation/icon.svg'));
    }
  }

  watchButtonPrefs() {
    simplePrefs.on('useTextButton', this.setButton.bind(this));
    simplePrefs.on('customButtonText', this.setButtonText.bind(this));
    simplePrefs.on('customButtonImgURL', this.setButtonImg.bind(this));
  }

  showPanel() {
    const windowRect = this.button.getBoundingClientRect();
    const panelPosition = windowRect.left - this.panel.width / 2;
    this.panel.show({
      position: {
        top: 0,
        left: panelPosition,
      },
    });
  }

  showButton() {
    this.button.setAttribute('hidden', 'false');
  }

  hideButton() {
    this.button.setAttribute('hidden', 'true');
  }

  // Prepares panel with info in background
  prepPanel(rec) {
    this.panel.height = rec.length * panelRecHeight;
    this.panel.port.emit('data', rec);
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

  show(recs) {
    this.checkForInstalled(recs);
    this.prepPanel(recs);
    this.showButton();
  }

  // Checks that current window is target domain
  waitForWindow(tab) {
    for (let rec of this.recData) { // eslint-disable-line prefer-const
      if (tab.url.includes(rec.domain)) {
        this.show(rec.data);
        return;
      }
    }
    this.hideButton(); // only reached if none of rec domains match
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
    recommender.start();
  },
};
