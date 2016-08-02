const { Recommender } = require('./Recommend.js');
const { Log } = require('lib/ConsoleLog.js');
const simplePrefs = require('sdk/simple-prefs');

Log.debug(Recommender);
let Rec = null;

const variations = {
  'default'() {
    Rec = new Recommender();
    Rec.start();
  },
  'autoOpenPanel'() {
    simplePrefs.prefs.autoOpenPanel = true;
    Rec.start();
  },
  'contol'() {},
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
