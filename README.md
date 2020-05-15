# 简介

这是一个下载指定资源的插件 可以下载github的资源 

## 使用

自己创建站点在setting 里进行url 设置


## 数据互通

使用 postMessage 进行通讯

接收格式

```
//下载状态
{
    target: 'iframe',
    act: 'downComplete',
    data: {
        type:'start' //startList start error success
        data:[{path:url}]
    }
}
//获取文件夹
{
    target: 'iframe',
    act: 'dirList',
    data: ['src/a','src/b']
}
```

发送格式

```
//下载指定资源到文件夹
{
    target: 'vscode',
    act: 'down',
    file:'https://github.com/ct-team/vuetsadm/tree/master/template/build-user',
    dir: 'src/a',
}
//获取当前文件夹
{
    target: 'vscode',
    act: 'getDir',
}
```