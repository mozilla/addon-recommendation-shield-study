const { Recommender } = require("../lib/Recommend");

const tabs = require("sdk/tabs");
function only1Tab () {
  let first = true;
  for (let tab of tabs) {
    if (first) {
      first = false;
      continue;
    }
    tab.close();
  }
}


exports['test only onboard while installing'] = function (assert) {
  assert.pass();
};



exports['test onboarding' ] = function (assert) {
  let R;

  console.log(Object.keys(assert));

  // install
  R = new Recommender();
  console.log(R.onboarding);
  assert.ok(!R.onboarding, "R should NOT be onboarding yet.");
  R.start('install');
  assert.ok(R.onboarding, "R should onboarding yet.");
  R.destroy()

  // startup
  R = new Recommender();
  assert.ok(!R.onboarding, "R should NOT be onboarding.");
  R.start('startup');
  assert.ok(!R.onboarding, "R should STILL NOT be onboarding.");
  R.destroy();


  only1Tab();
}


require("sdk/test").run(exports);
