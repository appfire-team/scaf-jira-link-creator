#!/usr/bin/env node

import fs from 'fs';
import axios from 'axios';
import csv from 'fast-csv';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import Logger from './logger.js';

const {log, logSummary, LOG_LEVELS: {INFO, ERROR}} = Logger;

const argv = yargs(hideBin(process.argv))
  .option("jira-url", {
    type: "string",
    describe: "Jira base url"
  })
  .option("conf-url", {
    type: "string",
    describe: "Confluence base url"
  })
  .option("csv", {
    type: "string",
    describe: "CSV filename in the current folder"
  })
  .option("app-id", {
    type: "string",
    describe: "AppID can be obtained from the Application Links menu in Jira (Click on pencil icon and ID is in the URL)"
  })
  .option("jira-auth", {
    type: "string",
    describe: "Username and password for the Jira user with 'Link Issues' permission in the following format 'username:password'"
  })
  .option("dry-run", {
    type: "boolean",
    default: false,
    describe: "Script will not submit HTTP requests, if this flag is enabled."
  })
  .demandOption(["jira-url", "conf-url", "csv", "app-id", "jira-auth"])
  .argv;

const ISSUE_KEY_REGEX = /(?<=key&quot;&gt;)[A-Z]+-[0-9]+(?=&lt;)/g;

const jiraEndpoint = argv['jira-url'];
const confluenceEndpoint = argv['conf-url'];
const csvFilename = argv['csv'];
const appId = argv['app-id'];
const usernameAndPassword = argv['jira-auth'];
const isDryRun = argv['dry-run'];

const authBuffer = Buffer.from(usernameAndPassword, 'utf-8');
const requests = [];
let createdLinksCount = 0;
let preexistingLinksCount = 0;
let errCount = 0;

const processRow = row => {

  const pageId = row["Page ID"];
  const title = row["Page Title"];
  const metadata = row["text_val"];

  const issueKeys = metadata.match(ISSUE_KEY_REGEX);
  log(INFO, `[PAGE-ID: ${pageId}] Keys: ${issueKeys}`);

  const body = {
    globalId: `appId=${appId}&pageId=${pageId}`,
    application: {
      type: "com.atlassian.confluence",
      name: "Confluence"
    },
    relationship: "mentioned in",
    object: {
      url: `${confluenceEndpoint}/pages/viewpage.action?pageId=${pageId}`,
      title
    }
  };

  issueKeys.forEach(issueKey => {
    const requestUrl = `${jiraEndpoint}/rest/api/latest/issue/${issueKey}/remotelink`;

    if (isDryRun) {
      log(INFO, `[DRY-RUN] Will update ${requestUrl}`);
      return;
    }

    requests.push(
      axios.post(requestUrl, body, {
        headers: {
          'Authorization': `Basic ${authBuffer.toString('base64')}`,
          'Content-Type': 'application/json'
        }
      })
        .then(result => {
          result.status === 201 ? createdLinksCount++ : preexistingLinksCount++;
          log(INFO, `Update success: ${requestUrl} => ${result.status} ${JSON.stringify(result.data)}`);
        })
        .catch(error => {
          errCount++
          log(ERROR, JSON.stringify(body.object));
          if (error.response) {
            log(ERROR, `[ERROR] ${requestUrl} => ${error.response.status}`);
          }
        })
    )
  });
};

fs.createReadStream(csvFilename)
  .pipe(csv.parse({headers: true}))
  .on("error", console.error)
  .on("data", processRow)
  .on("end", async rowCount => {
    log(INFO, `Parsed ${rowCount} rows`);
    await Promise.allSettled(requests);
    logSummary(rowCount, requests.length, createdLinksCount, preexistingLinksCount, errCount, isDryRun);
  });