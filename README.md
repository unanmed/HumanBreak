# 魔塔 人类：开天辟地

游戏地址：https://h5mota.com/tower/?name=HumanBreak

## 项目结构

`public`: mota-js 样板所在目录，该塔对样板的目录进行了一定的魔改，其中插件全部移动到`src/plugin/game`文件夹中，并使用了`es模块化`

`src`: 游戏除样板核心代码外所有内容所在目录，所有内容支持`typescript`。其中包含以下内容：

1. `plugin`: 所有相关插件的源码，其中包含多个文件夹，内有不同的内容，其中`game`文件夹与游戏进程有关，不能涉及`dom`等`node`无法运行的操作，否则录像验证会报错
2. `ui`: 所有 ui 的 vue 源码
3. `panel`: ui 中用到的部分面板
4. `components`: 所有 ui 的通用组件
5. `data`: 数据文件，包含百科全书的内容、成就的内容等
6. `fonts`: ui 中用到的字体文件
7. `types`: mota-js 的类型声明文件
8. `source`: mota-js 的图块等资源的类型声明文件，会通过热重载更新
9. `initPlugin.ts`: 所有插件的入口文件
10. `main.ts`: 主入口，会将`App.vue`与`App2.vue`渲染到 html 上

`script`: 在构建、发布等操作时会用到的 node 脚本

`vite.config.ts`: `vite`的配置文件

`mota.config.ts`: 魔塔配置文件

## 开发说明

1. 首先请确保你安装了`node.js`与`pnpm`
2. 将项目拉到你的设备上
3. 运行`pnpm i`以安装所有依赖包
4. 在根目录运行`pnpm run dev`以启动`vite`服务和样板的`http`服务与热重载服务
5. 打开`vite`提供的网址即可进入游戏
6. 打开样板服务提供的网址即可进入编辑器

## 构建说明

1. 运行`pnpm run build`以打包以`/games/HumanBreak/`为目录的构建包
2. 运行`pnpm run build-local`以打包以`/`为目录的本地构建包
3. 运行`pnpm run build-gh`以打包以`/HumanBreak/`为目录的可部署到`github pages`的构建包

### 构建流程

1. 运行`vue-tsc`检查类型是否正确
2. 运行`vite`的构建工具，打包除`public`外的内容
3. 运行`script/build.ts`，首先去除未使用的文件（即全塔属性中未注册的文件），然后压缩字体，再用`rollup` `terser`及`babel`压缩插件与`main.js`

## 热重载说明

支持以下内容的热重载：

1. `vite`热重载
2. 楼层热重载
3. 脚本编辑热重载
4. 道具、怪物、图块属性热重载
5. styles.css

以下内容修改后会自动刷新页面

1. `vite`提供的自动刷新页面
2. 全塔属性
3. libs/下的文件
4. main.js
