//META{"name":"popup"}*//

const fs = require("fs");
const http = require("http");

let config = "";

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
    const request = require("request");

    request(site, function(error, response, body) {
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
    "changeBackground": function(hex) {
       for (element of document.getElementsByTagName("div")) {
          if (element.className.startsWith("notice")) {
            element.style.backgroundColor = hex;
          }
        }
    },
    "changeColor": function(hex) {
        for (element of document.getElementsByTagName("div")) {
            if (element.className.startsWith("notice")) {
              element.style.color = hex;
            }
          }
    },
    "changeText": function(text) {
        for (element of document.getElementsByTagName("div")) {
            if (element.className.startsWith("notice")) {
              element.innerText = text;
            }
          }  
    },
    "generateTextBox": function () {
       let res = false;
       for (element of document.getElementsByTagName("div")) {
          if (element.className.startsWith("notice")) {
            element.innerHTML = "Generated text box."
            res = true;
          }
        }
        if (!res) {
            for (element of document.getElementsByTagName("div")) {
                if (element.className.startsWith("base")) {
                    let elem = document.createElement("div")
                    elem.className = "notice-3bPHh- colorStreamerMode-2SJAUN";
                    elem.innerHTML = 'Generated text box.'
                    element.insertBefore(elem, element.firstChild);
                }
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
    getVersion() { return "0.1.0"; }
    getAuthor() { return "creamy-dev"; }

    getSettingsPanel() {
        return this.htmlContents || "Error fetching contents.";
    }
    
    load() { return true; }

    unload() { return true; }

    async switchDaemon() {
      rgblog("Actvating SwitcherooDaemon");

      function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

      while (true) {
        await sleep(500);
        let hasFound = false;

        for (element of document.getElementsByTagName("div")) {
          let count = 0;

          if (element.className.startsWith("notice")) {
            rgblog("found notice",count);
            hasFound = true;

            if (count !== 0) {
              //element.style.zIndex = -10;
              rgblog("found element!");
            }

            count++;
          }
        }

        if (!hasFound) {
          textChangeAPI.generateTextBox();
          textChangeAPI.changeBackground(config.backgroundColor);
          textChangeAPI.changeColor(config.textColor);
          textChangeAPI.changeText(config.text);
        }

        rgblog("done finding notices");
      }
    }

    async start() {
          try {
            if (fs.existsSync(__dirname + "/ezPopupConfig.json")) {
              config = JSON.parse(await fs.readFileSync(__dirname + "/ezPopupConfig.json", "utf8"));
            } else {
              let exampleContents = await doRequest("https://raw.githubusercontent.com/creamy-dev/ezPopup/main/config_sample.json");
              if (exampleContents.status == 200) {
                exampleContents = JSON.parse(exampleContents.body);
                config = exampleContents;
                rgblog(exampleContents)
                await fs.writeFileSync(__dirname + "/ezPopupConfig.json", `{"backgroundColor": "${exampleContents.backgroundColor}", "textColor": "${exampleContents.textColor}", "text": "${exampleContents.text}"}`);
              }
            }

            this.htmlContents = await doRequest("https://raw.githubusercontent.com/creamy-dev/ezPopup/main/config_panel.html");
            //this.htmlContents = await doRequest("http://localhost:3000/html");

            rgblog(this.htmlContents);

            this.htmlContents = this.htmlContents.body;

            this.htmlContents = this.htmlContents.replaceAll("id_0", config.textColor);
            this.htmlContents = this.htmlContents.replaceAll("id_1", config.backgroundColor);
            this.htmlContents = this.htmlContents.replaceAll("id_2", config.text);
      
            textChangeAPI.generateTextBox();
            textChangeAPI.changeBackground(config.backgroundColor);
            textChangeAPI.changeColor(config.textColor);
            textChangeAPI.changeText(config.text);

            document.saveSettings = async function(config) {
              await fs.writeFileSync(__dirname + "/ezPopupConfig.json", `{"backgroundColor": "${config.backgroundColor}", "textColor": "${config.textColor}", "text": "${config.text}"}`)
              textChangeAPI.changeBackground(config.backgroundColor);
              textChangeAPI.changeColor(config.textColor);
              textChangeAPI.changeText(config.text);
              return(true);
            }

            this.switchDaemon();
          } catch (err) {
            rgblog(err);
          }
    }
       
    stop() {
        for (element of document.getElementsByTagName("div")) {
          if (element.className.startsWith("notice")) {
            element.parentNode.removeChild(element);
          }
        }
    };

    initialize() {
        this.initialized = true;
    }
}
