class Notify {
  start() {
    this.whyBoxShowing = false;
    this.setupFooter();
    self.port.on('data', recs => {
      this.recs = recs;
      this.clearAllRecommendations();
      this.hideWhyBox();
      this.showAllRecommendations();
    });
    self.port.on('onboard', () => {
      document.getElementById('welcome').classList.remove('hidden');
    });
    self.port.on('endOnboard', () => {
      document.getElementById('welcome').remove();
    });
  }

  clearAllRecommendations() {
    const recDiv = document.getElementById('recs');
    while (recDiv.firstChild) {
      recDiv.removeChild(recDiv.firstChild);
    }
  }

  addRecommendations(startIndex, endIndex) {
    for (let i = startIndex; i < endIndex; i++) {
      this.createRecommendationBox(this.recs[i]);
    }
  }

  showAllRecommendations() {
    this.addRecommendations(0, this.recs.length);
  }

  setupFooter() {
    // const disableForSiteButton = document.querySelector('#disable-button');
    const whyButton = document.querySelector('#why-button');
    whyButton.addEventListener('click', this.handleWhyClick.bind(this));
    const closeWhyButton = document.querySelector('#close-why-button');
    closeWhyButton.addEventListener('click', this.closeWhyBox.bind(this));
    const disableSiteButton = document.querySelector('#disable-site-button');
    disableSiteButton.addEventListener('click', () => {
      self.port.emit('disableSite');
    });
    const disableForeverButton = document.querySelector('#disable-forever-button');
    disableForeverButton.addEventListener('click', () => {
      self.port.emit('disableForever');
    });
  }

  createEmptyBox() {
    const templateDiv = document.getElementById('template-div');
    const dupDiv = templateDiv.cloneNode(true);
    dupDiv.removeAttribute('id');
    dupDiv.classList.remove('hidden');
    document.getElementById('recs').appendChild(dupDiv);
    return dupDiv;
  }

  createRecommendationBox(data) {
    const div = this.createEmptyBox();
    div.querySelector('.name').textContent = data.name;
    div.querySelector('.description').textContent = data.description;
    div.querySelector('.image').setAttribute('src', data.imageURL);
    div.querySelector('.image').addEventListener('click', () => {
      this.handleMoreInfoClick(data);
    });
    const button = div.getElementsByTagName('label')[0];
    button.addEventListener('click', () => {
      this.handleInstallClick(button, data);
    });
    if (data.isInstalled) {
      this.buttonShowInstalled(button);
    }
  }

  buttonShowInstalling(button) {
    button.parentNode.setAttribute('class', 'switch installing');
  }

  buttonShowInstalled(button) {
    const input = button.parentNode.getElementsByTagName('input')[0];
    input.setAttribute('checked', 'checked');
    button.parentNode.setAttribute('class', 'switch installed');
  }

  buttonShowUninstalled(button) {
    const input = button.parentNode.getElementsByTagName('input')[0];
    input.removeAttribute('checked');
    button.parentNode.setAttribute('class', 'switch uninstalled');
  }

  requestInstallChange(command, button, data) {
    self.port.emit(command, data);
    this.buttonShowInstalling(button);
    const successMessage = command + data.packageURL;
    self.port.on(successMessage, () => {
      if (command === 'install') {
        this.buttonShowInstalled(button);
        data.isInstalled = true; // eslint-disable-line no-param-reassign
      } else {
        this.buttonShowUninstalled(button);
        data.isInstalled = false; // eslint-disable-line no-param-reassign
      }
    });
  }

  handleInstallClick(button, data) {
    let command = 'install';
    if (data.isInstalled) {
      command = 'uninstall';
    }
    this.requestInstallChange(command, button, data);
  }

  handleMoreInfoClick(data) {
    self.port.emit('info', data);
  }

  handleWhyClick() {
    if (this.whyBoxShowing) {
      this.closeWhyBox();
    } else {
      this.showWhyBox();
      self.port.emit('why');
    }
  }

  showWhyBox() {
    this.whyBoxShowing = true;
    const lastRec = document.querySelector('.addon-box:last-child');
    lastRec.classList.add('hidden');
    const whyBox = document.querySelector('#why-box');
    whyBox.classList.remove('hidden');
    const whyButton = document.querySelector('#why-button');
    whyButton.classList.add('grayed');
  }

  closeWhyBox() {
    this.hideWhyBox();
    const lastRec = document.querySelector('.addon-box:last-child');
    lastRec.classList.remove('hidden');
  }

  hideWhyBox() {
    this.whyBoxShowing = false;
    const whyBox = document.querySelector('#why-box');
    whyBox.classList.add('hidden');
    const whyButton = document.querySelector('#why-button');
    whyButton.classList.remove('grayed');
  }
}

const notify = new Notify();
notify.start();
