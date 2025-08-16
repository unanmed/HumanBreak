# 魔塔 人类：开天辟地

游戏地址：https://h5mota.com/tower/?name=HumanBreak

## 项目结构

`public`: mota-js 样板所在目录。
`packages`: 核心引擎代码 monorepo。
`packages-user`: 用户代码 monorepo。
`src`: 游戏入口代码。

由于样板由此项目分离而来（类似于 `vscode` 与 `monaco-editor` 的关系），因此将用户代码部分与核心引擎分开编写。不过由于旧样板限制与重构的不完全，引擎中还有部分内容会引用旧样板内容。

`packages` `packages-user` 可以单独打包为库模式，`src` 单向引用 `packages-user`，`packages-user` 单向引用 `packages`，`src` 为游戏的入口代码。

## 开发环境

- `node.js ^18.0.0 || ^20.0.0 || >=22.0.0`
- `pnpm >= 10.0.0`
- 任意支持 `ES2024` 特性的浏览器

**建议使用 `vscode`，搭配 `prettier` `eslint` 插件**

## 开发说明

1. 将项目拉取到本地。
2. 运行 `pnpm i` 安装所有依赖，如有要求运行 `pnpm approve-builds`，请允许全部。
3. 运行 `pnpm dev` 进入开发环境。

## 构建说明

- `pnpm build:packages`: 构建所有 `packages` 文件夹下的内容，使用库模式。
- `pnpm build:game`: 构建为可以直接部署构建包。
- `pnpm build:lib`: 构建所有 `packages` `packages-user` 文件夹下的内容，使用库模式。

## 开发原则

- 模块无副作用原则：
    - 所有模块不包含副作用内容，全部由函数、类、常量的声明组成，不出现导出的变量声明、代码执行内容，允许但不建议编写类的静态块。
    - 如果需要模块初始化，编写一个 `createXxx` 函数，然后在 `index.ts` 中整合，再逐级向上传递，直至遇到包含 `create` 函数的 `index.ts`，所有初始化将会统一在顶层模块中执行。
- 命名规则：
    - 变量、成员、一般常量、方法、函数使用小驼峰。
    - 类、接口、类型别名、命名空间、泛型、枚举、组件使用大驼峰。
    - 不变常量使用全大写命名法，单词之间使用下划线连接。
    - 专有名词缩写如 `HTTP`, `URI` 全部大写。
    - 会被 `implements` 的接口使用大写 `I` 开头。
    - `id`, `class` 等 `HTML/CSS` 内容使用连字符命名法。
    - 不使用下划线命名法。
- 注释：
    - 常用属性成员、方法、接口、类型必须添加 `jsDoc` 注释。
    - 长文件可使用 `#region` 分段，非必要则不写 `#endregion`。
    - TODO 使用 `// TODO:` 或 `// todo:` 格式。
    - 单行注释的双斜杠与注释内容之间添加一个空格，多行注释只允许出现 `jsDoc` 注释，如果需要多行非 `jsDoc` 注释，使用多个单行注释。
- 类型：
    - 不允许出现非必要的 `any` 类型。
    - 所有类的成员必须显式声明类型。
    - 如果有无法避免出现类型错误的地方，使用 `// @ts-expect-error` 标记，并填写原因。
    - 没用到的变量、方法使用下划线开头。
    - 合理运用 `readonly` `protected` `private` 关键字。
    - 函数不建议使用过多可选参数，如果可选参数过多，可以考虑换用对象。
- 代码格式：
    - 严格遵循 `eslint` 配置，不允许出现 `eslint` 报错。
