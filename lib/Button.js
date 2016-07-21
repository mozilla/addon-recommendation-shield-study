const { getNodeView } = require('sdk/view/core');
const { Class: sdkClass } = require('sdk/core/heritage');
const sdkData = require('sdk/self').data;
const simplePrefs = require('sdk/simple-prefs');

const Button = sdkClass({
  initialize(chromeWindow, callback) {
    this.doc = chromeWindow.document;
    this.button = this.doc.createElement('div');
    this.button.id = 'recommend-button';
    this.button.buttonIcon = this.doc.createElement('div');
    this.button.buttonMessage = this.doc.createElement('div');
    this.button.buttonMessageIcon = this.doc.createElement('image');
    this.button.buttonMessageIcon.setAttribute('src', sdkData.url('recommendation/icon.svg'));
    this.button.buttonMessageIcon.setAttribute('class', 'urlbar-icon');
    this.button.buttonMessage.appendChild(this.button.buttonMessageIcon);
    this.button.buttonMessageText = this.doc.createElement('h1');
    this.button.buttonMessage.appendChild(this.button.buttonMessageText);
    this.button.buttonMessage.style.background = 'linear-gradient(#67CD45, #00a920)';
    this.button.buttonMessage.style.padding = '2px 8px 2px 0';
    this.button.buttonMessage.style['border-radius'] = '15px';
    this.button.buttonMessage.style.color = 'white';
    this.button.buttonMessage.style['box-shadow'] = '0 1px 2px -2px #6A6A6A';
    this.button.buttonIcon.appendChild(this.button.buttonMessage);
    this.button.buttonImg = this.doc.createElement('image');
    this.button.buttonImg.setAttribute('class', 'urlbar-icon');
    this.button.buttonImg.setAttribute('src', sdkData.url('recommendation/icon.svg'));
    this.button.buttonIcon.appendChild(this.button.buttonImg);
    this.button.appendChild(this.button.buttonIcon);
    this.setButton();
    simplePrefs.on('useTextButton', this.setButton.bind(this));
    this.button.buttonIcon.addEventListener('click', () => {
      callback(this);
    });
  },
  show() {
    this.doc.getElementById('urlbar-icons').appendChild(this.button);
  },
  hide() {
    this.button.remove();
  },
  setButton() {
    if (simplePrefs.prefs.useTextButton) {
      this.useText();
    } else {
      this.useIcon();
    }
  },
  useIcon() {
    this.button.buttonMessage.setAttribute('hidden', 'true');
    this.button.buttonImg.setAttribute('hidden', 'false');
  },
  useText() {
    this.button.buttonImg.setAttribute('hidden', 'true');
    this.button.buttonMessage.setAttribute('hidden', 'false');
  },
});
getNodeView.define(Button, button => button.button);

exports.Button = Button;
