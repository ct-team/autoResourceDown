const vscode = require('vscode');
const util = require('./webview/util');
const gitdown = require('./webview/git-down');
// const fs = require('fs');
// const path = require('path');
function getWebViewContent(context, templatePath, url) {
    let tempUrl = templatePath;
    if (!url) {
        tempUrl = 'webview/no-page.html';
    }
    return util.getWebViewContent(context, tempUrl, url);
}
function activate(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'extension.autoResourceDown',
            function () {
                const root =
                    vscode.workspace
                        .getConfiguration()
                        .get('autoResourceDown.root') || '/';
                const downUrl = vscode.workspace
                    .getConfiguration()
                    .get('autoResourceDown.url');
                // 创建webview
                const panel = vscode.window.createWebviewPanel(
                    'testWebview', // viewType
                    '前端资源管理', // 视图标题
                    vscode.ViewColumn.One, // 显示在编辑器的哪个部位
                    {
                        enableScripts: true, // 启用JS，默认禁用
                        retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
                    }
                );
                panel.webview.html = getWebViewContent(
                    context,
                    'webview/webview.html',
                    downUrl
                );
                panel.webview.onDidReceiveMessage(
                    (message) => {
                        if (message.act === 'down') {
                            gitdown.nodeModules(
                                message.file,
                                message.dir,
                                function (result) {
                                    panel.webview.postMessage({
                                        target: 'iframe',
                                        act: 'downComplete',
                                        data: result,
                                    });
                                },
                                util.getProjectPath()
                            );
                        }
                        if (message.act === 'getDir') {
                            let filePath = util.getProjectPath();
                            // util.log(filePath);
                            // util.showError(path.join(filePath, root));
                            // let item;
                            // try {
                            //     item = fs.readdirSync(path.join(filePath, root).replace(/^\\/, ''));
                            // } catch (error) {
                            //     item = error;
                            // }
                            // util.showError(JSON.stringify(item));
                            // util.showError(JSON.stringify(util.getAllAlbums(filePath, root)));
                            panel.webview.postMessage({
                                target: 'iframe',
                                act: 'dirList',
                                data: util.getAllAlbums(filePath, root),
                                downFile: filePath,
                            });
                        }
                    },
                    undefined,
                    context.subscriptions
                );
            }
        )
    );
}
module.exports = {
    activate,
};
