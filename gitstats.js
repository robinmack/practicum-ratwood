#!/usr/bin/env node
'use strict';
const os = require ('os');
const math = require('math');
const fs = require('fs');
const command = require('commander');
command
    .version('1.0')
    .option('-r, --report [value]', 'Type of statistics to display; valid options are:\n' +
        '\t[stars] for number of stars, \n' +
        '\tforks for number of forks, \n' +
        '\tpulls for number of pull requests, \n' +
        '\tcont for contribution percentage, (pull requests/forks)\n', 'stars')
    .option('-n, --number <n>', 'Number of repositories to report [10]', parseInt)
    .option('-o, --organization [value]', 'Organization to view [netflix]', 'netflix')
    .option('-u, --username [value]', 'Username (used for basic authentication)')
    .option('-p, --password [value]', 'Password (used for basic authentication)')
    .option('-v, --verbose', 'Pretty print with process information')
    .parse(process.argv);

const GitHubApi = require('github');
let github,
    reportBuffer = [],
    pullReqBuffer = [];

main();


function main(){
    let home = os.homedir();
    let gitStatsConf = "";
    //pull in stored settings
    const configFilePath = home + "/.newt/gitstats.json";
    if (fs.existsSync(configFilePath)) {
        if (command.verbose) {
            console.log("Loading from ~/.newt/gitstats.json");
        }

        try{
            gitStatsConf = require(configFilePath);
        } catch (exception) {
            errorOut(exception.message);
        }
    }
    //settings default hierarchy
    command.report = command.report || gitStatsConf.report || "stars";
    command.organization = command.organization || gitStatsConf.organization || "netflix";
    command.number = command.number || parseInt(gitStatsConf.number) || 10;
    command.username = command.username || gitStatsConf.username || undefined;
    command.password = command.password || gitStatsConf.password || undefined;
    command.verbose = command.verbose || gitStatsConf.verbose || false;

    github = new GitHubApi({
        debug: false,
        Promise: require('bluebird'),
        timeout: 5000,
        host: 'api.github.com',
        protocol: 'https',
        headers: {
            'access-control-expose-headers':'Link',
            'user-agent': 'request'
        },
        rejectUnauthorized: false, // default: true
    });

    if (!!command.username && !!command.password) {
        if (command.verbose) {
            console.log("Logging in as " + command.username);
        }
        github.authenticate({
            type: 'basic',
            username: command.username,
            password: command.password
        });
    }
    launchReport(command.report);
}

function launchReport(report){
    if (command.verbose) {
        console.log('Organization: ' + command.organization);
    }

    switch (report){
        case "stars":
            if (command.verbose) {
                console.log("Top " + command.number + " repositories by Number of Stars");
            }
            reportNumberOfStars();
            break;
        case "forks":
            if (command.verbose) {
                console.log("Top " + command.number + " repositories by Number of Forks");
            }
            reportNumberOfForks();
            break;
        case "pulls":
            if (command.verbose) {
                console.log("Top " + command.number + " repositories by Number of PullReqs");
            }
            reportNumberOfPullReqs();
            break;
        case "cont":
            if (command.verbose) {
                console.log("Top " + command.number + " repositories by Contribution Percentage (Requests/Forks)");
            }
            reportPercentageContribution();
            break;
        default:
            errorOut("Unsupported report: '" + command.report + "'");
    }
}

function reportNumberOfStars(){
    reportBuffer=[];
    getOrgs()
        .then(()=>{
            printReportLines(reportBuffer, "Stars", "stargazers_count");
        })
        .catch(err=>{
            errorOut(err);
        });
}

function reportNumberOfPullReqs(){
    reportBuffer=[];
    getOrgs()
        .then(()=>{
        getAllPullRequests(reportBuffer)
            .then(()=> {
                printReportLines(reportBuffer, "Pull Reqs", "pullRequestCount");
            })
            .catch(err =>
                errorOut(err)
            );
        });
}

function reportNumberOfForks(){
    reportBuffer=[];
    getOrgs()
        .then(()=>{
            printReportLines(reportBuffer, "Forks", "forks");
        })
        .catch(error=>{
            errorOut(error);
        });
}

function reportPercentageContribution(){
    reportBuffer=[];
    getOrgs()
        .then(()=>{
            getAllPullRequests(reportBuffer)
                .then(()=> {
                    reportBuffer.map(repo=> {
                        repo.percentageContribution = math.round((repo.pullRequestCount / repo.forks) * 1000) / 10;
                    });
                    printReportLines(reportBuffer, "Con. %", "percentageContribution");
                })
                .catch(error=>errorOut(error));
        })
}

function printReportLines(data, label, field){
    let explanation = '';
    data.sort((a,b)=>{
        return parseFloat(a[field]) - parseFloat(b[field]);
    });
    if (data.length < command.number){
        explanation = "(There were fewer than " + command.number + " repositories in " + command.organization + ", all shown)";
        command.number = data.length;
    }
    if (command.verbose) {
        console.log(label + "\tRepo Name\t:\tURL");
    }
    for (let x = data.length-1; x > data.length - command.number -1; x--){
        if (data[x][field].toString() === "NaN"){
            data[x][field] = "N/A";
        }
        console.log(data[x][field] + "\t" + data[x]["full_name"] + " : " + data[x]["html_url"]);
    }
    if (command.verbose) {
        console.log(explanation);
    }
}

function getOrgs(){
    return new Promise ((resolve, reject) => {
        github.repos.getForOrg({
            org: command.organization
        }).then(result => {
            if (github.hasNextPage(result)) {
                getNextPage(result, reportBuffer).then(() => {
                    reportBuffer = reportBuffer.concat(result.data);
                    resolve();
                })
                .catch(error => {
                    reject(error);
                });
            } else {
                reportBuffer = reportBuffer.concat(result.data);
                resolve();
            }
        }).catch(error => {
            reject(error);
        })
    });
}

async function getAllPullRequests() {
    pullReqBuffer=[];
    await Promise.all(reportBuffer.map(repo => {
        return new Promise((resolve, reject) => {
            github.pullRequests.getAll({repo: repo["name"], owner: repo["owner"].login}).then(result => {
                    if (github.hasNextPage(result)) {
                        getNextPage(result, pullReqBuffer).then(() => {
                            pullReqBuffer = pullReqBuffer.concat(result.data);
                            repo.pullRequestCount = pullReqBuffer.length;
                            resolve();
                        }).catch((error) => {
                            reject(error);
                        });
                    } else {
                        pullReqBuffer = reportBuffer.concat(result.data);
                        repo.pullRequestCount = pullReqBuffer.length;
                        resolve();
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    }));
}

function getNextPage(oldResult, buffer){
    return new Promise((resolve, reject) => {
        github.getNextPage(oldResult).then((result)=>{
            if (github.hasNextPage(result)){
                getNextPage(result, buffer).then(()=>{
                    buffer = buffer.concat(result.data);
                    resolve();
                })
            } else {
                buffer = buffer.concat(result.data);
                resolve();
            }
        }).catch(error => {
            reject(error);
        });
    })
}

function errorOut(exception){
    if (!!exception){
        console.log(exception);
    }
    process.exit(1);
}
