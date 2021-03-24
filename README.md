# Scaffolding Jira Link Creator

NodeJS script to create Jira links for Jira macros embedded within Text Data macro (that were missing due to a Scaffolding bug) 
based on exported database data from Confluence.

## Prerequisites

1. NodeJS 14 or higher needs to be installed. The latest [LTS version](https://nodejs.org/en/) is recommended.
2. Jira and Confluence need to be accessible from the machine that is executing the script.
3. The user whose credentials will be used to execute the script must have "Link Issues" permission for the target projects.
4. If your Jira server uses any request rate limiters, DoS or brute-force protection (e.g. Fail2Ban, ModSecurity), ensure
   that the environment executing the script is whitelisted.
5. As is the case with any bulk operation, test this script on a staging environment first.
6. It is recommended to run this script at a period of low activity and traffic in the Jira server.
7. A CSV extract of Jira links within Text Data macro is done. Execute `extract-jira-link-pages.sql` in your database 
   and export the result set to a CSV file. The CSV file should be placed in the same folder as the `index.js` script file.
   1. If you are expecting very large results from the SQL query, you may paginate it by using `limit` and `offset` to 
   select the results in stages and export to separate CSV files.
   2. You can then run the script once for each CSV file created.

## Usage

1. Before running the script for the first time, install the dependencies using `npm install`.
2. Run `node index.js --help`. Read the descriptions of the arguments and ensure you have them available.
3. Run:

```sh
node index.js --jira-url <jira base url> \
    --conf-url <confluence base url> \
    --csv <csv filename> \
    --app-id <confluence app id> \
    --jira-auth <username:password> \
    --dry-run
```
**NOTE:** If `--dry-run` is present, no HTTP requests will be sent and nothing will be updated. Useful to verify if the 
CSV file is being parsed correctly.

4. A timestamped log file will be saved in the same directory with a separate error log if any were encountered. 