const { Recommend } = require('lib/Recommend.js');

const variations = {
  'default'() {
    Recommend.start();
  },
};

function isEligible() {
  return true;
}

function cleanup() {
  Recommend.destroy();
}

module.exports = {
  isEligible,
  cleanup,
  variations,
};
