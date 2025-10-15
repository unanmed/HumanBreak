# 编写新 UI

在 `packages-user/client-modules/src/render/ui` 文件夹下创建一个新的 UI 文件，编写完 UI 后在你需要打开此 UI 的地方调用 `mainUIController.open` 即可。

## UI 模板

UI 编写模板如下：

```tsx
// 引入必要接口
import { defineComponent } from 'vue';
import { GameUI, UIComponentProps, DefaultProps } from '@motajs/system-ui';
import { SetupComponentOptions } from '../components';

// 定义组件的参数
export interface MyComProps extends UIComponentProps, DefaultProps {}

// 定义组件的参数，需要传递给 vue
const myComProps = {
    // 这两个参数不能少
    props: ['controller', 'instance']
} satisfies SetupComponentOptions<MyComProps>;

// 定义组件内容
export const MyCom = defineComponent<MyComProps>(props => {
    // 在这里编写你的 UI 即可
    return () => <container></container>;
}, myComProps);

// 定义 UI 对象
export const MyUI = new GameUI('my-ui', MyCom);
```

## 打开 UI

在需要打开 UI 的地方调用：

```ts
// 在 client-modules 模块外引入
import { mainUIController } from '@user/client-modules';
// 在 client-modules 模块内引入
// 应该从 client-modules/src/render/ui/controller.tsx 中引入，自行根据路径关系引入，或者使用 vscode 的自动补全时会自动帮你引入
import { mainUIController } from './ui/controller';
// 引入你自己的 UI
import { MyUI } from './myUI';

// 在需要打开时调用，第二个参数为传递给 UI 的参数，即 Props
mainUIController.open(MyUI, {});
```

如果需要在 UI 内打开 UI，推荐使用如下方式：

```tsx
export const MyCom = defineComponent<MyComProps>(props => {
    // 使用 props.controller，适配不同 UI 控制器
    props.controller.open(MyUI2, {});
    return () => <container></container>;
}, myComProps);
```

## 关闭 UI

在 UI 内关闭自身使用：

```tsx
export const MyCom = defineComponent<MyComProps>(props => {
    // 关闭自身
    props.controller.close(props.instance);
    return () => <container></container>;
}, myComProps);
```

而如果在 UI 外关闭的话，需要接受 `controller.open` 的返回值：

```ts
// 接收返回值
const ins = controller.open(MyUI, {});

// 关闭此 UI
controller.close(ins);
```

## UI 编写参考

参考[此文档](../ui/ui.md)，此文档将会教你如何从头开始编写一个 UI，并解释 UI 运行与渲染的基本逻辑。

## 拓展-UI 与组件的区别

UI 包含 `controller` `instance` 两个参数，且必须通过 UI 控制器打开，而组件不包含这两个参数，不能由 UI 控制器打开，需要作为组件或 UI 内的组件调用（类似于标签）。可以自行阅读样板自带 UI 与组件，来理解二者的区别。

或者用模块的角度来说，组件是函数，而 UI 是一整个模块，函数可以调用函数，而自然组件也可以调用组件。UI 由组件和元素构成，就像模块可以由函数和变量构成。

除此之外，组件不能被定义为 `GameUI`，只有 UI 可以。例如：

```tsx
// 一个没有 controller, instance 的组件
export const MyComponent = defineComponent(() => {
    return () => <container></container>;
});

// 这是不行的！同时 ts 也会为你贴心报错！
export const MyComponentUI = new GameUI('my-component', MyComponent);

// --------------------

interface MyComProps extends DefaultProps, UIComponentProps {}

// 一个包含 controller, instance 的组件，此处省略 myComProps 定义
export const MyCom = defineComponent<MyComProps>(props => {
    return () => <container></container>;
}, myComProps);

// 这是可以的，可以被 UIController 打开！
export const MyComUI = new GameUI('my-com', MyCom);
```
