class Notify {
  start() {
    this.onboarded = false;
    self.port.on('data', recs => {
      this.recs = recs;
      this.clearAllRecommendations();
      this.showAllRecommendations();
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

  createEmptyBox() {
    const templateDiv = document.getElementById('template-div');
    const dupDiv = templateDiv.cloneNode(true);
    dupDiv.removeAttribute('id');
    dupDiv.removeAttribute('hidden');
    dupDiv.className = 'addon-box';
    document.getElementById('recs').appendChild(dupDiv);
    return dupDiv;
  }

  createRecommendationBox(data) {
    const div = this.createEmptyBox();
    div.querySelector('.name').innerHTML = data.name;
    div.querySelector('.description').innerHTML = data.description;
    div.querySelector('.image').setAttribute('src', data.imageURL);
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
}

const notify = new Notify();
notify.start();
