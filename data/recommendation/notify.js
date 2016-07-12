class Notify {
  constructor() {
    self.port.on('data', recs => {
      this.recs = recs;
      this.clearAllRecommendations();
      this.showAllRecommendations();
    });
  }

  clearAllRecommendations() {
    var recDiv = document.getElementById('recs');
    while(recDiv.firstChild) {
      recDiv.removeChild(recDiv.firstChild);
    }
  }

  addRecommendations(startIndex, endIndex) {
    for(var i = startIndex; i < endIndex; i++) {
      var box = this.createNewBox();
      this.fillInValues(box, this.recs[i]);
    }
  }

  showAllRecommendations() {
    this.addRecommendations(0, this.recs.length);
  }

  createNewBox() {
    var templateDiv = document.getElementById('template-div');
    var dupDiv = templateDiv.cloneNode(true);
    dupDiv.removeAttribute('id');
    dupDiv.removeAttribute('hidden');
    dupDiv.className = 'addon-box';
    document.getElementById('recs').appendChild(dupDiv);
    return dupDiv;
  }

  //replace default inner-html values
  fillInValues(div, data) {
    div.querySelector('.name').innerHTML = data.name;
    div.querySelector('.description').innerHTML = data.description;
    div.querySelector('.image').setAttribute('src', data.imageURL);
    var button = div.getElementsByTagName('label')[0];
    button.addEventListener('click', () => {
      this.handleInstallClick(button, data);
    });
    if(data.isInstalled) {
      this.buttonShowInstalled(button);
    }
  }

  buttonShowInstalling(button) {
    button.parentNode.setAttribute('class', 'switch installing');
  }

  buttonShowInstalled(button) {
    var input = button.parentNode.getElementsByTagName('input')[0];
    input.setAttribute('checked', 'checked');
    button.parentNode.setAttribute('class', 'switch installed');
  }

  buttonShowUninstalled(button) {
    var input = button.parentNode.getElementsByTagName('input')[0];
    input.removeAttribute('checked');
    button.parentNode.setAttribute('class', 'switch uninstalled');
  }

  requestInstallChange(command, button, data) {
    self.port.emit(command, data);
    this.buttonShowInstalling(button);
    var successMessage = command + data.packageURL;
    self.port.on(successMessage, () => {
      if(command === 'install') {
        this.buttonShowInstalled(button);
        data.isInstalled = true;
      }
      else {
        this.buttonShowUninstalled(button);
        data.isInstalled = false;
      }
    });
  }

  handleInstallClick(button, data) {
    var command = 'install';
    if(data.isInstalled) {
      command = 'uninstall';
    }
    this.requestInstallChange(command, button, data);
  }
}

new Notify();
