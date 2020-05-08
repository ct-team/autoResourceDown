const url = require('url');
const fs = require('fs');
const path = require('path');
const ProgressBar = require('progress');
const logSymbols = require('log-symbols');
const axios = require('axios');
const request = require('request');
const chalk = require('chalk');

let exportBaseUrl = '';

let bar = null; // loading bar
let protocol = null;
let argvs = [];
let targetDir = ''; //存放目录
let startDir = ''; //初始目录
let pageComplete = null;
const defaultConfig = {
    coverRepo: true, // 命令行默认为true, node modules为false
    branch: 'master',
};
/**
 * @param {String} BaseUrl
 */
function parseUrl(BaseUrl) {
    try {
        const pathObj = url.parse(BaseUrl);
        const ghUrl = pathObj.path;
        protocol = pathObj.protocol;
        const infoList = ghUrl.split('/');
        let username = infoList[1];
        let repos = infoList[2];
        let branch = '';
        let download = '';
        const includeList = ['/tree/', '/blob/'];
        let includeSwitch = false;
        includeList.map((item) => {
            if (ghUrl.indexOf(item) > -1 && !includeSwitch) {
                includeSwitch = true;
                branch = infoList[4];
                const list = ghUrl.split(item);
                download = list[1].split('/');
                download.shift();
                download = download.join('/');
            }
        });
        if (!includeSwitch) {
            branch = defaultConfig.branch;
        }
        requestUrl(username, repos, branch, download);
    } catch (e) {
        console.log(logSymbols.error, chalk.red('url error'));
    }
}

/**
 * @desc request api
 * @param {String} username
 * @param {String} repos
 * @param {String} branch
 * @param {String} download
 */
function requestUrl(username, repos, branch, download) {
    // request start

    const url = `${protocol}//api.github.com/repos/${username}/${repos}/git/trees/${branch}?recursive=1`;
    console.log(url);
    axios
        .get(url)
        .then((res) => {
            const data = res.data;
            const trees = data.tree;
            handleTree(username, repos, branch, trees, download);
        })
        .catch((e) => {
            console.log(e);
            console.log(chalk.red(`network is error!`));
            runComplete({ type: 'error', data: `network is error!` });
        });
}

/**
 * parse response
 * @param {String} username
 * @param {String} repos
 * @param {String} branch
 * @param {String} tree
 * @param {String} download
 */
function handleTree(username, repos, branch, tree, download) {
    let filterList = tree.filter((item) => {
        return item.type === 'blob';
    });
    console.log(filterList);
    if (download !== '') {
        filterList = filterList.filter((item) => {
            // create reg
            const downRepl = download
                .replace(/\//g, '\\/')
                .replace(/\./g, '\\.');
            const reg = new RegExp(`^${downRepl}`);
            return reg.test(item.path);
        });
    }
    // request list is ready

    bar = new ProgressBar(':bar :current/:total', {
        total: filterList.length,
    });
    console.log(filterList);
    runComplete({ type: 'start', data: filterList });
    filterList.map((item) => {
        downloadFile(username, repos, branch, item.path);
    });
}
function getDirFile(url) {
    const file = url.split(startDir);

    if (file && file[1]) {
        return file[1];
    }
    return url;
}
/**
 * @param {String} username
 * @param {String} repos
 * @param {String} branch
 * @param {String} url
 */
function downloadFile(username, repos, branch, url) {
    // download file
    console.log(exportBaseUrl);
    const exportUrl = path.join(exportBaseUrl, targetDir, getDirFile(url));
    const dir = path.dirname(exportUrl);
    // console.log(exportUrl);
    // console.log(dir);
    // mkdir
    mkdirsSync(dir);
    console.log(
        `url:${protocol}//github.com/${username}/${repos}/raw/${branch}/${url}`
    );
    request(
        `${protocol}//github.com/${username}/${repos}/raw/${branch}/${url}`,
        (err, res, body) => {
            if (err) {
                console.log(logSymbols.error, chalk.red(`${url} is error`));
                runComplete({ type: 'error', data: url });
                return;
            }
            bar.tick();
            if (bar.complete) {
                console.log(
                    logSymbols.success,
                    chalk.green(`${repos} all files download!`)
                );
                runComplete({ type: 'success'});
                const BaseUrl = argvs.shift();
                if (!BaseUrl) {
                    return;
                }
                parseUrl(BaseUrl);
            }
        }
    ).pipe(fs.createWriteStream(exportUrl));
}

/**
 * @param {String} dirname
 * @returns
 */
function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    }
    if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
    }
}

function urlQueueParse(urls) {
    argvs.push(urls);
    const BaseUrl = decodeURI(argvs.shift());
    if (!BaseUrl) {
        console.log(chalk.red('url is required!'));
        return;
    }
    parseUrl(BaseUrl);
}

function setStartDir(file) {
    if (!file) {
        startDir = '';
        return;
    }
    const result = file.split('/').reverse();

    if (result[0].indexOf('.') >= 0) {
        startDir = result[1];
    }
    startDir = result[0];
}
function runComplete(data) {
    if (pageComplete) {
        pageComplete(data);
    }
}
/**
 * @desc parse the way of node modules
 * @param {Object} config
 * @returns
 */
function nodeModules(urls, dir, complete, baseUrl) {
    console.log(11);
    // if (config) {
    //     config = config || {};
    //     Object.assign(
    //         defaultConfig,
    //         {
    //             coverRepo: false, // 下载默认为覆盖
    //         },
    //         config
    //     );
    // }
    exportBaseUrl =path.join(baseUrl, '');
    pageComplete = complete;
    targetDir = dir;
    setStartDir(urls);
    urlQueueParse(urls);
}

module.exports = {
    nodeModules,
};
