# Scaffolding Jira Link Creator

NodeJS script to create Jira links (that were missing due to a Scaffolding bug) based on exported database data from Confluence.

## Prerequisities

1. NodeJS needs to be installed. Suggest to use the latest [LTS version](https://nodejs.org/en/).
2. Jira and Confluence needs to be accessible from the machine that is executing the script.
3. A CSV extract of Jira links is done. Execute `extract-jira-link-pages.sql` in your database and export the result set to a CSV file. The CSV file shoudl be placed in the same folder as the `index.js` script file.

## Usage

Before running the script for the first time, install the dependencies using `npm install`.

```sh
node index.js --jira-url <jira endpoint> \
    --conf-url <confluence endpoint> \
    --csv <csv filename> \
    --app-id <app id> \
    --jira-auth <username and password> \
    --dry-run
```
**NOTE:** If `--dry-run` is present, no HTTP requests will be sent and nothing will be updated. Useful to verify if CSV is being parsed correctly.