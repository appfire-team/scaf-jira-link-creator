#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
    .option("jiraUrl", {
        type: "string",
        describe: "Jira base url"
    })
    .option("confUrl", {
        type: "string",
        describe: "Confluence base url"
    })
    .option("csv", {
        type: "string",
        describe: "CSV filename in the current folder"
    })
    .option("appId", {
        type: "string",
        describe: "AppID can be obtained from the Application Links menu in Jira (Click on pencil icon and ID is in the URL)"
    })
    .demandOption(["jiraUrl", "confUrl", "csv", "appId"])
    .argv;

const ISSUE_KEY_REGEX = /(?<=key&quot;&gt;)[A-Z]+-[0-9]+(?=&lt;)/g;

// TODO Add feature for dry run - don't make HTTP requests

const jiraEndpoint = argv.jiraUrl;
const confluenceEndpoint = argv.confUrl;
const csvFilename = argv.csv;
const appId = argv.appId;

// Send HTTP requests to Jira
const processRow = row => {

    // Q: What about versions? Do we need to update on all versions?

    const pageId = row["Page ID"];
    const title = row["Page Title"];
    const metadata = row["text_val"];

    const issueKeys = metadata.match(ISSUE_KEY_REGEX);
    console.log("Keys: ", issueKeys);

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

    console.log(body);

    issueKeys.forEach(issueKey => {
        const requestUrl = `${jiraEndpoint}/rest/api/latest/issue/${issueKey}/remotelink`;
        console.log(requestUrl);
    });
};

fs.createReadStream(path.resolve(__dirname, csvFilename))
    .pipe(csv.parse({ headers: true }))
    .on("error", error => console.error(error))
    .on("data", processRow)
    .on("end", rowCount => console.log(`Parsed ${rowCount} rows`));
