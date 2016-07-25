const { before, after } = require('sdk/test/utils');
const { Recommender } = require('../lib/Recommend.js');

let recommender;

exports['test main'] = (assert) => {
  assert.pass('Unit test running!');
};

exports['test main async'] = (assert, done) => {
  assert.pass('async Unit test running!');
  done();
};

exports['test recommend createPanel'] = (assert) => {
  assert.ok((recommender.panel.isShowing === false), 'Panel created!');
};

require('sdk/test').run(exports);

before(exports, () => {
  recommender = new Recommender();
});

after(exports, () => {
  recommender.destroy();
  recommender = null;
});
