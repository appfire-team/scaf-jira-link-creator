import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default class Logger {
  static LOG_LEVELS = {
    INFO: 'info',
    ERROR: 'error'
  }
  static #START_TIMESTAMP = new Date().toISOString();

  static log = (logLevel, data) => {
    switch (logLevel) {
      case Logger.LOG_LEVELS.INFO:
        console.log(data);
        fs.appendFile(path.resolve(__dirname, `${this.#START_TIMESTAMP}.log`), `${data}\n`, (err) => this.#loggerErrorHandler(err));
        break;
      case Logger.LOG_LEVELS.ERROR:
        console.error(data);
        fs.appendFile(path.resolve(__dirname, `${this.#START_TIMESTAMP}-err.log`), `${data}\n`, (err) => this.#loggerErrorHandler(err));
        break;
      default:
        console.error(`log level ${logLevel} is not supported`)
        break;
    }
  }

  static logSummary = (pageCount, issueCount, createdLinksCount, preexistingLinksCount, errCount, isDryRun) => {
    const summary = `
########################################################################################################################

    ###############
${isDryRun ? "    ##  DRY RUN  ##" : "    ###############"}
    ##  SUMMARY  ##
    ###############
    
    Confluence Pages Processed: ${pageCount} Pages
    Jira Issues Processed: ${issueCount} Issues
    Created Remote Links: ${createdLinksCount} Links
    Preexisting Remote Links: ${preexistingLinksCount} Links
    Errors Encountered: ${errCount} Errors
    
    Full log available at ${path.resolve(__dirname, this.#START_TIMESTAMP + '.log')}
    ${errCount ? "Error log is available at " + path.resolve(__dirname, this.#START_TIMESTAMP + '-err.log') : ""}
    
########################################################################################################################
    `;

    Logger.log(Logger.LOG_LEVELS.INFO, summary);
  }

  static #loggerErrorHandler = (err) => {
    if (err) {
      console.error('Failed to write to log file', err)
    }
  }
}