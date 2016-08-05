const xutils = require('shield-studies-addon-utils');

class TelemetryLog {
  constructor() {
    this.buttonShowCount = 0;
    this.panelShowCount = 0;
    this.installCount = 0;
    this.disableCount = 0;
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
    this.panelShowCount += 1;
    this.log({
      messageType: 'showPanel',
      domain,
      panelShowTime: Date.now(),
      panelShowCount: this.panelShowCount,
    });
  }

  hidePanel(domain) {
    this.log({
      messageType: 'hidePanel',
      domain,
      panelShowTime: Date.now(),
      panelShowCount: this.panelShowCount,
    });
  }

  showButton(domain) {
    this.buttonShowCount += 1;
    this.log({
      messageType: 'showButton',
      domain,
      buttonShowTime: Date.now(),
      buttonShowCount: this.buttonShowCount,
    });
  }
  install(addonData) {
    this.installCount += 1;
    this.log({
      messageType: 'install',
      addonData,
      addonId: addonData.id,
      installRequestTime: Date.now(),
      installCount: this.installCount,
    });
  }

  disableSite(domain) {
    this.disableCount += 1;
    this.log({
      messageType: 'disableSite',
      domain,
      installRequestTime: Date.now(),
      disableCount: this.disableCount,
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

exports.TelemetryLog = new TelemetryLog();
