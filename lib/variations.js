const { Recommender } = require('./Recommend.js');
const simplePrefs = require('sdk/simple-prefs');

let Rec = null;

const variations = {
  'passive-panel'() {
    Rec = new Recommender();
    Rec.start();
  },
  'auto-open-panel'() {
    simplePrefs.prefs.autoOpenPanel = true;
    Rec = new Recommender();
    Rec.start();
  },
  'observe-only'() {},
};

function isEligible() {
  return true;
}

function cleanup() {
  Rec.destroy();
  Rec = null;
}

module.exports = {
  isEligible,
  cleanup,
  variations,
};
