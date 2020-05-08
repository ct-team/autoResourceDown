const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const util = {
    /**
     * 获取当前所在工程根目录
     */
    getProjectPath() {
        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            this.showError('获取工程根路径异常！');
            return __dirname;
        }
        let workspaceFoldersFile = workspaceFolders.map((item) =>
            item.uri.path.replace(/^\//, '').replace(/\//g, '\\')
        );

        return workspaceFoldersFile[0];
    },
    /**
     * 从某个HTML文件读取能被Webview加载的HTML内容
     * @param {*} context 上下文
     * @param {*} templatePath 相对于插件根目录的html文件相对路径
     */
    getWebViewContent: function (context, templatePath, url) {
        const resourcePath = util.getExtensionFileAbsolutePath(
            context,
            templatePath
        );
        const dirPath = path.dirname(resourcePath);
        let html = fs.readFileSync(resourcePath, 'utf-8');
        // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
        html = html.replace(
            /(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g,
            (m, $1, $2) => {
                return (
                    $1 +
                    vscode.Uri.file(path.resolve(dirPath, $2))
                        .with({ scheme: 'vscode-resource' })
                        .toString() +
                    '"'
                );
            }
        );
        html = html.replace('##url##', url);
        return html;
    },
    /**
     * 全局日志开关，发布时可以注释掉日志输出
     */
    log: function (...args) {
        console.log(...args);
    },
    /**
     * 全局日志开关，发布时可以注释掉日志输出
     */
    error: function (...args) {
        console.error(...args);
    },
    /**
     * 弹出错误信息
     */
    showError: function (info) {
        vscode.window.showErrorMessage(info);
    },
    /**
     * 弹出提示信息
     */
    showInfo: function (info) {
        vscode.window.showInformationMessage(info);
    },

    /**
     * 获取某个扩展文件绝对路径
     * @param context 上下文
     * @param relativePath 扩展中某个文件相对于根目录的路径，如 images/test.jpg
     */
    getExtensionFileAbsolutePath: function (context, relativePath) {
        return path.join(context.extensionPath, relativePath);
    },

    /**
     * @function {获取所有文件}
     * @return {Array} {文件}
     */
    getAllAlbums(baseUrl, root) {
        const getAllDirs = function (mypath) {
            let items;
            let result = [];
            try {
                items = fs.readdirSync(path.join(baseUrl, mypath));
            } catch (error) {
                return result;
            }

            console.log(items);
            // 遍历当前目录中所有的文件和文件夹
            items.map((item) => {
                let temp = path.join(mypath, item);
                let itemFile = path.join(baseUrl, mypath, item);
                // 若当前的为文件夹
                if (item === 'node_modules') {
                    return;
                }
                if (fs.statSync(itemFile).isDirectory()) {
                    result.push(temp); // 存储当前文件夹的名字

                    // 进入下一级文件夹访问

                    result = result.concat(getAllDirs(temp));
                }
            });

            return result;
        };
        return getAllDirs(root);
    },
};

module.exports = util;
