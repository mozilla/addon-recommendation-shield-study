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
    this.button.buttonMessageText = this.doc.createElement('h1');
    this.button.buttonMessageText.innerHTML = 'Customize';
    this.button.buttonMessage.appendChild(this.button.buttonMessageText);
    this.button.buttonMessageIcon = this.doc.createElement('image');
    this.button.buttonMessageIcon.setAttribute('src', sdkData.url('recommendation/iconWhite.svg'));
    this.button.buttonMessageIcon.setAttribute('class', 'urlbar-icon');
    this.button.buttonMessageIcon.style['margin-left'] = '4px';
    this.button.buttonMessage.appendChild(this.button.buttonMessageIcon);
    this.button.buttonMessage.style.background = '#57bd35';
    this.button.buttonMessage.style.padding = '2px 2px 2px 8px';
    this.button.buttonMessage.style['border-radius'] = '3px';
    this.button.buttonMessage.style.color = 'white';
    this.button.buttonMessage.style['box-shadow'] = '0 1px 2px -2px #6A6A6A';
    this.button.buttonIcon.appendChild(this.button.buttonMessage);
    this.button.buttonImg = this.doc.createElement('image');
    this.button.buttonImg.setAttribute('class', 'urlbar-icon');
    this.button.buttonImg.setAttribute('src', sdkData.url('recommendation/iconGray.svg'));
    this.button.buttonIcon.appendChild(this.button.buttonImg);
    this.button.appendChild(this.button.buttonIcon);
    this.button.addEventListener('mouseover', this.handleHover.bind(this));
    this.button.addEventListener('mouseout', this.handleUnhover.bind(this));
    this.setVariation();
    simplePrefs.on('smallButton', this.setVariation.bind(this));
    this.button.buttonIcon.addEventListener('click', () => {
      callback(this);
    });
    this.panelShowing = false;
  },
  show() {
    this.doc.getElementById('urlbar-icons').appendChild(this.button);
  },
  hide() {
    this.button.remove();
  },
  setVariation() {
    this.smallButton = simplePrefs.prefs.smallButton;
    if (this.smallButton) {
      this.useIcon();
    } else {
      this.useText();
    }
  },
  handleHover() {
    if (this.smallButton) {
      this.button.buttonImg.setAttribute('src', sdkData.url('recommendation/iconBlue.svg'));
    } else {
      this.button.buttonMessage.style.background = '#40a624';
    }
  },
  handleUnhover() {
    if (this.panelShowing) {
      return;
    }
    if (this.smallButton) {
      this.button.buttonImg.setAttribute('src', sdkData.url('recommendation/iconGray.svg'));
    } else {
      this.button.buttonMessage.style.background = '#57bd35';
    }
  },
  handlePanelOpen() {
    this.panelShowing = true;
    this.useText();
    this.button.buttonMessage.style.background = '#40a624';
  },
  handlePanelHide() {
    this.panelShowing = false;
    if (this.smallButton) {
      this.useIcon();
    } else {
      this.button.buttonMessage.style.background = '#57bd35';
    }
  },
  useIcon() {
    this.button.buttonImg.setAttribute('src', sdkData.url('recommendation/iconGray.svg'));
    this.button.buttonMessage.setAttribute('hidden', 'true');
    this.button.buttonImg.setAttribute('hidden', 'false');
  },
  useText() {
    this.button.buttonMessage.style.background = '#57bd35';
    this.button.buttonImg.setAttribute('hidden', 'true');
    this.button.buttonMessage.setAttribute('hidden', 'false');
  },
});
getNodeView.define(Button, button => button.button);

exports.Button = Button;
