const { Recommender } = require('./Recommend.js');
const { Log } = require('lib/ConsoleLog.js');

Log.debug(Recommender);
let Rec = null;

const variations = {
  'default'() {
    Rec = new Recommender();
    Rec.start();
  },
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
