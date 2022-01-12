//META{"name":"popup"}*//

const fs = require("fs");
const path = require("path");

let config = {};

function rgblog(...args) {
  console.log('%c[ezPopup]%c', 'color: #0080ff', '', ...args);
}

/**
 * Do a request with options provided.
 *
 * @param {site} site site to request
 * @return {Promise} a promise of request
 */
function doRequest(site) {
  return new Promise((resolve, reject) => {
    require("request")(site, function (error, response, body) {
      if (error) {
        reject({
          error: error,
          status: response.statusCode
        })
      } else {
        resolve({
          body: body,
          status: response.statusCode
        });
      }
    })
  });
}

let textChangeAPI = {
  "changeBackground": function (hex) {
    let countOfElem = 0;
    for (element of document.getElementsByTagName("div")) {
      if (element.className.startsWith("notice")) {
        if (countOfElem == 0) {
          element.style.backgroundColor = hex;
        }

        countOfElem++;
      }
    }
  },
  "changeColor": function (hex) {
    let countOfElem = 0;
    for (element of document.getElementsByTagName("div")) {
      if (element.className.startsWith("notice")) {
        if (countOfElem == 0) {
          element.style.color = hex;
        }

        countOfElem++;
      }
    }
  },
  "changeText": function (text) {
    let countOfElem = 0;
    for (element of document.getElementsByTagName("div")) {
      if (element.className.startsWith("notice")) {
        if (countOfElem == 0) {
          element.innerText = text;
        }

        countOfElem++;
      }
    }
  },
  "generateTextBox": async function () {
    try {
      let countOfElem = 0;
      for (element of document.getElementsByTagName("div")) {
        if (element.className.startsWith("notice")) {
          if (countOfElem == 0) {
            if (element.innerText == config.text) {
              element.parentNode.removeChild(element);
            }
          }
  
          countOfElem++;
        }
      }

      let elem = document.createElement("div")
      elem.className = "notice-3bPHh- colorStreamerMode-2SJAUN";
      elem.innerHTML = 'Generated text box.';

      document.getElementsByClassName("base-3dtUhz")[0].insertBefore(elem, document.getElementsByClassName("base-3dtUhz")[0].firstChild);
    } catch (e) {
      rgblog(e);
      while (true) {
        sleep(1000);
      }
    }
  }
}

class popup {
  constructor() {
    this.initialized = false;
  }

  getName() { return "ezPopup"; }
  getShortName() { return "ezPopup"; }
  getDescription() { return "This shows a configurable popup on the top of the page."; }
  getVersion() { return "0.4.1"; }
  getAuthor() { return "creamy-dev"; }

  getSettingsPanel() {
    return this.htmlContents || "Error fetching contents.";
  }

  load() { return true; }

  unload() { return true; }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async switchDaemon() {
    rgblog("Actvating SwitcherooDaemon");

    while (true) {
      await this.sleep(1000);

      if (this.killSwitch) { return; }

      let hasFound = false;
      let countOfNotices = 0;

      for (element of document.getElementsByTagName("div")) {
        if (element.className.startsWith("notice")) {
          hasFound = true;

          if (countOfNotices !== 0) {
            element.style.zIndex = -10;
            element.style.position = "absolute";
            element.style.top = "0px";
            element.style.left = "0px";
            element.style.width = "10%";
          }

          countOfNotices++;
        }
      }

      if (!hasFound) {
        textChangeAPI.generateTextBox();
        textChangeAPI.changeBackground(config.backgroundColor);
        textChangeAPI.changeColor(config.textColor);
        textChangeAPI.changeText(config.text);
      }
      
      let tempCountColorCheck = 0;

      if (document.getElementsByClassName("notice-3bPHh-").length - 1 == 0) {
        for (element of document.getElementsByTagName("div")) {
          if (element.className.startsWith("notice")) {
            if (tempCountColorCheck == 0) {
              element.style.backgroundColor = config.backgroundColor;
            }

            tempCountColorCheck++;
          }
        }
      } else {
        for (element of document.getElementsByTagName("div")) {
          if (element.className.startsWith("notice")) {
            if (tempCountColorCheck == 0) {
              element.style.backgroundColor = config.streamerBackgroundColor;
            }

            tempCountColorCheck++;
          }
        }
      }
    }
  }

  async hangApp(deathToPrint) {
    rgblog("Hanging plugin for debugging.");
    rgblog("Requested information to print:", deathToPrint);
    while (true) {
      if (this.killSwitch) { return; }
      await this.sleep(1000);
    }
  }

  async autoUpdate() {
    rgblog("Initializing Auto Updater...");
    let updateCheck = await doRequest("https://raw.githubusercontent.com/creamy-dev/ezPopup/main/version.json");

    if (updateCheck.status == 200) {
      updateCheck = JSON.parse(updateCheck.body);
      
      rgblog("Checking if version is newer...");
      rgblog("Current version:", this.getVersion());
      rgblog("Latest version:", updateCheck.version);

      if (updateCheck.version > this.getVersion()) {
        rgblog("Check passed!");
        rgblog("Attempting to update...");

        let changelog = await doRequest(updateCheck.url);

        let updateArr = ["Changelog:"]

        for (let item of changelog) {
          updateArr.push(item);
        }

        BdApi.showConfirmationModal("Update Avalible", updateArr,
          {
            confirmText: "Update",
            cancelText: "Cancel",
            onConfirm: async () => {
              rgblog("Downloading new version...");

              let data = await doRequest("https://raw.githubusercontent.com/creamy-dev/ezPopup/main/ezPopup.plugin.js");

              if (data.status == 200) {
                data = data.body;

                rgblog("Writing new version to file...");
                fs.writeFileSync(path.join(__dirname, "ezPopup.plugin.js"), data);
                
                BdApi.showToast("Updated successfully.", {type:"success"})

                rgblog("Reloading plugin...");
                this.killSwitch = true;
                this.unload();
              }
            },
            onCancel: async () => {
              rgblog("User declined update.");
            }
          }
        );
      }
    }
  }

  async start() {
    rgblog("Checking for updates...");
    await this.autoUpdate();
    rgblog("Starting...")
    this.killSwitch = false;

    try {
      if (fs.existsSync(__dirname + "/ezPopupConfig.json")) {
        config = JSON.parse(await fs.readFileSync(__dirname + "/ezPopupConfig.json", "utf8"));

        if (config.streamerBackgroundColor == null || config.streamerBackgroundColor == undefined) {
          config.streamerBackgroundColor = "#ffffff";
          await fs.writeFileSync(__dirname + "/ezPopupConfig.json", `{"backgroundColor": "${config.backgroundColor}", "streamerBackgroundColor": "${config.streamerBackgroundColor}", "textColor": "${config.textColor}", "text": "${config.text}"}`)
        }
      } else {
        let exampleContents = await doRequest("https://raw.githubusercontent.com/creamy-dev/ezPopup/main/config_sample.json");

        if (exampleContents.status == 200) {
          exampleContents = JSON.parse(exampleContents.body);
          config = exampleContents;
          rgblog(exampleContents)
          await fs.writeFileSync(__dirname + "/ezPopupConfig.json", `{"backgroundColor": "${exampleContents.backgroundColor}", "streamerBackgroundColor": "${exampleContents.streamerBackgroundColor}", "textColor": "${exampleContents.textColor}", "text": "${exampleContents.text}"}`);
        }
      }

      this.htmlContents = await doRequest("https://raw.githubusercontent.com/creamy-dev/ezPopup/main/config_panel.html");

      if (this.htmlContents.body == null || this.htmlContents.body == undefined) {
        rgblog("Error fetching contents.");
        this.htmlContents = "Looks like the server for the panel is down! Please try again later.";
      }

      this.htmlContents = this.htmlContents.body;

      this.htmlContents = this.htmlContents.replaceAll("id_0", config.textColor);
      this.htmlContents = this.htmlContents.replaceAll("id_1", config.backgroundColor);
      this.htmlContents = this.htmlContents.replaceAll("id_3", config.streamerBackgroundColor);
      this.htmlContents = this.htmlContents.replaceAll("id_2", config.text);

      await textChangeAPI.generateTextBox();
      textChangeAPI.changeBackground(config.backgroundColor);
      textChangeAPI.changeColor(config.textColor);
      textChangeAPI.changeText(config.text);

      document.saveSettings = async function (config) {
        if (this.killSwitch) { return; }
        await fs.writeFileSync(__dirname + "/ezPopupConfig.json", `{"backgroundColor": "${config.backgroundColor}", "streamerBackgroundColor": "${config.streamerBackgroundColor}", "textColor": "${config.textColor}", "text": "${config.text}"}`)
        textChangeAPI.changeBackground(config.backgroundColor);
        textChangeAPI.changeColor(config.textColor);
        textChangeAPI.changeText(config.text);
        return (true);
      }

      this.switchDaemon();
    } catch (err) {
      rgblog(err);
      await this.stop();
    }
  }

  stop() {
    let countOfElem = 0;
    for (element of document.getElementsByTagName("div")) {
      if (element.className.startsWith("notice")) {
        if (countOfElem == 0) {
          element.parentNode.removeChild(element);
        }

        countOfElem++;
      }
    }

    this.killSwitch = true;
  };

  initialize() {
    this.initialized = true;
  }
}
