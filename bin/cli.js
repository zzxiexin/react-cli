#!/usr/bin/env node
/**
 * 命令行工具
 * version 1.0.0
 */
const path = require("path")
const program = require("commander")
// 模板选择交互
const inquirer = require("inquirer");
// 下载git仓库
const downloadGitRepo = require('download-git-repo')
// 下载的状态展示
const ora = require('ora')
// 文件状态展示
const fs = require('fs-extra')

const package = require("../package.json")
// 自定义模板
const staticTemplates = require("./templates.js")
const { getGitReposList } = require('./api.js')

// 拉取github模板或者使用本地模板
const getProjectTemplates = async (options) => {
    const getRepoLoading = ora('获取模版列表...');
    let templates = [];
    getRepoLoading.start();
    if (options?.user){
        templates = await getGitReposList(options?.user)
    } else {
        templates = staticTemplates;
    }
    getRepoLoading.succeed(templates?.length > 0 ? '获取模版列表成功!' : '获取模板失败')
    return templates;
};

// 下载模板
 const downLoadTemplateCode = (template, dest) => {
        // 开始loading
        const loading = ora('正在下载模版...')
        loading.start()
        // 5. 开始下载模版
        downloadGitRepo(template, dest, (err) => {
          if (err) {
            loading.fail('创建模版失败：' + err)
          } else {
            loading.succeed('创建模版成功!')
            console.log(`\ncd ${projectName}`)
            console.log('npm i')
            console.log('npm start\n')
          }
        })
 }

program
  .command("create [projectName]")
  .description("创建模版")
  .option('-u --user <user>', 'git仓库名称')
  .action(async (projectName, options) => {
    // 1、获取git或者本地模板
    const templates = await getProjectTemplates(options);
    
    // 2、create没有输入项目名称提示输入项目名称
    if(!projectName) {
      const { name } = await inquirer.prompt({
        type: "input",
        name: "name",
        message: "请输入需要创建的项目名称：",
      })
      projectName = name // 赋值输入的项目名称
    }

    // 3、选择对应的git模板
    const { template } = await inquirer.prompt({
        type: 'list',
        name: 'template',
        message: '请选择模版：',
        choices: templates // 模版列表
    })

    // 4、创建项目保存的路径
    const dest = path.join(process.cwd(), projectName)
    // 判断文件夹是否存在，存在就交互询问用户是否覆盖
    if(fs.existsSync(dest)) {
      const { force } = await inquirer.prompt({
        type: 'confirm',
        name: 'force',
        message: '目录已存在，是否覆盖？'
      })
      // 如果覆盖就删除文件夹继续往下执行，否的话就退出进程
      force ? fs.removeSync(dest) : process.exit(1)
    }
    
    // 5、下载模板
    downLoadTemplateCode(template, dest);
  })

// 定义当前版本
program.version(`v${package.version}`)
program.on('--help', () => {})
program.parse(process.argv)