const { Recommender } = require('./Recommend.js');
const { Log } = require('lib/ConsoleLog.js');

Log.debug(Recommender);
const Rec = new Recommender();

const variations = {
  'default'() {
    Rec.start();
  },
};

function isEligible() {
  return true;
}

function cleanup() {
  Rec.destroy();
}

module.exports = {
  isEligible,
  cleanup,
  variations,
};
