const { getNodeView } = require('sdk/view/core');
const { Class: sdkClass } = require('sdk/core/heritage');
const sdkData = require('sdk/self').data;

const Button = sdkClass({
  initialize(chromeWindow, callback) {
    this.doc = chromeWindow.document;
    this.button = this.doc.createElement('div');
    this.button.id = 'recommend-button';
    this.button.message = this.doc.createElement('h1');
    this.button.message.innerHTML = 'Customize';
    this.button.appendChild(this.button.message);
    this.button.icon = this.doc.createElement('image');
    this.button.icon.setAttribute('src', sdkData.url('recommendation/iconWhite.svg'));
    this.button.icon.setAttribute('class', 'urlbar-icon');
    this.button.icon.style['margin-left'] = '4px';
    this.button.appendChild(this.button.icon);
    this.button.style.background = '#57bd35';
    this.button.style.padding = '2px 2px 2px 8px';
    this.button.style['border-radius'] = '3px';
    this.button.style.color = 'white';
    this.button.style['box-shadow'] = '0 1px 2px -2px #6A6A6A';
    this.button.addEventListener('mouseover', this.handleHover.bind(this));
    this.button.addEventListener('mouseout', this.handleUnhover.bind(this));
    this.button.addEventListener('click', () => {
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
  handleHover() {
    this.button.style.background = '#40a624';
  },
  handleUnhover() {
    if (this.panelShowing) {
      return;
    }
    this.button.style.background = '#57bd35';
  },
  handlePanelOpen() {
    this.panelShowing = true;
    this.button.style.background = '#40a624';
  },
  handlePanelHide() {
    this.panelShowing = false;
    this.button.style.background = '#57bd35';
  },
});
getNodeView.define(Button, button => button.button);

exports.Button = Button;
