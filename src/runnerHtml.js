const {apiHtml}= require('./utils/api.js');

const runner = function (code, options) {
  let config = {};
  if (!options && !options?.apiKey) {
    const readUserConfig = require('./utils/config.js');
    config = readUserConfig();
  } else {
    config = options;
  }
  if (!config.apiKey || !config.apiKey.length) {
    throw new Error(
      'API Key is required to run wax-dev. Please reach out to https://account.wallyax.com/ to get your API Key.'
    );
  }
  return new Promise((resolve, reject) => {
    fetch(apiHtml, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${config.apiKey}`,
      },
      body: JSON.stringify({ element: code, rules: config.rules, isLinter:"false" }),
    })
      .then((response) => response.json())
      .then((data) => {
        resolve(data);
      })
      .catch((error) => reject(error));
  });
};

module.exports = runner;