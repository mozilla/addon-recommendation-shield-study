const xutils = require('shield-studies-addon-utils');

class TelemetryLog {
  constructor() {
    this.buttonShowCount = 0;
    this.panelShowCount = 0;
    this.installCount = 0;
  }
  onboard() {
    xutils.report({
      onboardInitTime: Date.now(),
    });
  }
  endOnboard() {
    xutils.report({
      onboardEndTime: Date.now(),
    });
  }
  showPanel() {
    this.panelShowCount += 1;
    xutils.report({
      panelShowTime: Date.now(),
      panelShowCount: this.panelShowCount,
    });
  }
  showButton() {
    this.buttonShowCount += 1;
    xutils.report({
      buttonShowTime: Date.now(),
      buttonShowCount: this.buttonShowCount,
    });
  }
  install() {
    this.installCount += 1;
    xutils.report({
      installRequestTime: Date.now(),
      installCount: this.installCount,
    });
  }
}

exports.TelemetryLog = new TelemetryLog();
