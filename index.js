#!/usr/bin/env node

const fs = require('fs');
const axios = require('axios');
const path = require('path');
const csv = require('fast-csv');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

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
        describe: "Username and password for jira in the following format \"username:password\""
    })
    .option("dry-run", {
        type: "boolean",
        default: false,
        describe: "Script will not submit HTTP requests, if this flag is enabled."
    })
    .demandOption(["jiraUrl", "confUrl", "csv", "appId"])
    .argv;

const ISSUE_KEY_REGEX = /(?<=key&quot;&gt;)[A-Z]+-[0-9]+(?=&lt;)/g;

const jiraEndpoint = argv['jira-url'];
const confluenceEndpoint = argv['conf-url'];
const csvFilename = argv.csv;
const appId = argv['app-id'];
const usernameAndPassword = argv['jira-auth'];
const isDryRun = argv['dry-run'];

const processRow = row => {

    const pageId = row["Page ID"];
    const title = row["Page Title"];
    const metadata = row["text_val"];

    const issueKeys = metadata.match(ISSUE_KEY_REGEX);
    console.log(`[PAGE-ID: ${pageId}] Keys: ${issueKeys}`);

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

    issueKeys.forEach(async issueKey => {
        const requestUrl = `${jiraEndpoint}/rest/api/latest/issue/${issueKey}/remotelink`;

        const authBuffer = Buffer.from(usernameAndPassword, 'utf-8');

        if (isDryRun) {
            console.log(`[DRY-RUN] Will update ${requestUrl}`);
            return;
        }

        await axios.post(requestUrl, body, {
            headers: {
                'Authorization': `Basic ${authBuffer.toString('base64')}` 
            }
        })
        .then(result => {
            console.log(`Update success: ${requestUrl} => ${result.status}`, result.data);
        })
        .catch(error => {
            if (error.response) {
                console.error(`[ERROR] ${requestUrl} => ${error.response.status}`, error.response.data);
            }
        });
    });
};

fs.createReadStream(path.resolve(__dirname, csvFilename))
    .pipe(csv.parse({ headers: true }))
    .on("error", console.error)
    .on("data", processRow)
    .on("end", async rowCount => {
        console.log(`Parsed ${rowCount} rows`);
    });
