const simpleStorage = require('sdk/simple-storage');
const xutils = require('shield-studies-addon-utils');

class TelemetryLog {
  constructor() {
    if (!simpleStorage.storage.TelemetryLogData) {
      simpleStorage.storage.TelemetryLogData = {
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
    simpleStorage.storage.TelemetryLogData.panelShowCount += 1;
    this.log({
      messageType: 'showPanel',
      domain,
      panelShowTime: Date.now(),
      panelShowCount: simpleStorage.storage.TelemetryLogData.panelShowCount,
    });
  }

  hidePanel(domain) {
    this.log({
      messageType: 'hidePanel',
      domain,
      panelShowTime: Date.now(),
      panelShowCount: simpleStorage.storage.TelemetryLogData.panelShowCount,
    });
  }

  showButton(domain) {
    simpleStorage.storage.TelemetryLogData.buttonShowCount += 1;
    this.log({
      messageType: 'showButton',
      domain,
      buttonShowTime: Date.now(),
      buttonShowCount: simpleStorage.storage.TelemetryLogData.buttonShowCount,
    });
  }

  whyButtonClicked(domain) {
    this.whyButtonClicked += 1;
    this.log({
      messageType: 'whyClick',
      domain,
      whyClickTime: Date.now(),
      whyClickCount: simpleStorage.storage.TelemetryLogData.whyButtonCount,
    });
  }

  install(addonData) {
    simpleStorage.storage.TelemetryLogData.installCount += 1;
    this.log({
      messageType: 'install',
      addonData,
      addonId: addonData.id,
      installRequestTime: Date.now(),
      installCount: simpleStorage.storage.TelemetryLogData.installCount,
    });
  }

  disableSite(domain) {
    simpleStorage.storage.TelemetryLogData.disableCount += 1;
    this.log({
      messageType: 'disableSite',
      domain,
      installRequestTime: Date.now(),
      disableCount: simpleStorage.storage.TelemetryLogData.disableCount,
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
