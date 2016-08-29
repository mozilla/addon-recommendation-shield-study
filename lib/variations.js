const { Recommender } = require('./Recommend.js');
const simplePrefs = require('sdk/simple-prefs');
const self = require("sdk/self");

let Rec = null;

const variations = {
  'passive-panel'() {
    Rec = new Recommender();
    Rec.start(self.loadReason);
  },
  'auto-open-panel'() {
    simplePrefs.prefs.autoOpenPanel = true;
    Rec = new Recommender();
    Rec.start(self.loadReason);
  },
  'observe-only'() {},
};

function isEligible() {
  return true;
}

function cleanup() {
  if (Rec) {
    Rec.destroy();
    Rec = null;
  }
}

module.exports = {
  isEligible,
  cleanup,
  variations,
};
