const log4js = require('log4js');
const config = require('../../config/log4js.config.js');

log4js.configure(config);

const console = log4js.getLogger();

module.exports = {
  console
};