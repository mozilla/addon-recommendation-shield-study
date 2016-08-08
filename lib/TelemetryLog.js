const simpleStorage = require('sdk/simple-storage');
const xutils = require('shield-studies-addon-utils');

class TelemetryLog {
  get logData() {
    return simpleStorage.storage.telemetryLogData;
  }

  set logData(newObject) {
    simpleStorage.storage.telemetryLogData = newObject;
  }

  increaseByOne(prop) {
    simpleStorage.storage.telemetryLogData[prop] += 1;
  }

  constructor() {
    if (!this.logData) {
      this.logData = {
        buttonShowCount: 0,
        panelShowCount: 0,
        installCount: 0,
        disableCount: 0,
        whyButtonCount: 0,
      };
    }
  }

  log(data) {
    const dataToReport = data;
    dataToReport.messageClass = 'addon-logging';
    xutils.report(dataToReport);
  }

  onboard(domain) {
    this.log({
      messageType: 'onboard',
      domain,
      onboardInitTime: Date.now(),
    });
  }
  endOnboard() {
    this.log({
      messageType: 'endOnboard',
      onboardEndTime: Date.now(),
    });
  }
  showPanel(domain) {
    this.increaseByOne('panelShowCount');
    this.log({
      messageType: 'showPanel',
      domain,
      panelShowTime: Date.now(),
      panelShowCount: this.logData.panelShowCount,
    });
  }

  hidePanel(domain) {
    this.log({
      messageType: 'hidePanel',
      domain,
      panelShowTime: Date.now(),
      panelShowCount: this.logData.panelShowCount,
    });
  }

  showButton(domain) {
    this.increaseByOne('buttonShowCount');
    this.log({
      messageType: 'showButton',
      domain,
      buttonShowTime: Date.now(),
      buttonShowCount: this.logData.buttonShowCount,
    });
  }

  whyButtonClicked(domain) {
    this.increaseByOne('whyButtonCount');
    this.log({
      messageType: 'whyClick',
      domain,
      whyClickTime: Date.now(),
      whyClickCount: this.logData.whyButtonCount,
    });
  }

  install(addonData) {
    this.increaseByOne('installCount');
    this.log({
      messageType: 'install',
      addonData,
      addonId: addonData.id,
      installRequestTime: Date.now(),
      installCount: this.logData.installCount,
    });
  }

  disableSite(domain) {
    this.increaseByOne('disableCount');
    this.log({
      messageType: 'disableSite',
      domain,
      installRequestTime: Date.now(),
      disableCount: this.logData.disableCount,
    });
  }

  disableAll(domain) {
    this.log({
      messageType: 'disableAll',
      domain,
      installRequestTime: Date.now(),
    });
  }
}

exports.TelemetryLog = TelemetryLog;
