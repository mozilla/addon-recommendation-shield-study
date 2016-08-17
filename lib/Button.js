const { Cc, Ci, Cu } = require('chrome');
const { Class: sdkClass } = require('sdk/core/heritage');
const { CustomizableUI } = Cu.import('resource:///modules/CustomizableUI.jsm', {});
const { getNodeView } = require('sdk/view/core');
const ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
const sdkData = require('sdk/self').data;
const sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);

const Button = sdkClass({
  initialize(chromeWindow, callback) {
    const sheetURI = ios.newURI(sdkData.url('recommendation/buttonStyle.css'), null, null);
    if (!sss.sheetRegistered(sheetURI, sss.USER_SHEET)) {
      sss.loadAndRegisterSheet(sheetURI, sss.USER_SHEET);
    }
    this.doc = chromeWindow.document;
    this.button = this.doc.createElement('div');
    this.button.id = 'site-enhance-recommend-button';
    this.button.classList.add('site-enhance-recommend-button');
    this.button.message = this.doc.createElement('h1');
    this.button.message.innerHTML = 'Enhance';
    this.button.appendChild(this.button.message);
    this.button.icon = this.doc.createElement('image');
    this.button.icon.setAttribute('src', sdkData.url('recommendation/iconWhite.svg'));
    this.button.icon.setAttribute('class', 'urlbar-icon');
    this.button.appendChild(this.button.icon);
    this.button.addEventListener('click', () => {
      callback(this);
    });
  },
  destroy() {
    this.button.remove();
    CustomizableUI.destroyWidget(this.button.id); // remove button from CustomizableUI cache
  },
  show() {
    this.doc.getElementById('urlbar-icons').appendChild(this.button);
  },
  hide() {
    this.button.remove();
  },
  handlePanelOpen() {
    this.button.classList.add('site-enhance-panelopen');
  },
  handlePanelHide() {
    this.button.classList.remove('site-enhance-panelopen');
  },
});
getNodeView.define(Button, button => button.button);

exports.Button = Button;
