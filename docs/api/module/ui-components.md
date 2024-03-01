# 模块 UIComponents

渲染进程模块，游戏进程不能直接使用

包含了可以用在 UI 里面的可复用组件

-   [`Box`](#box)
-   [`BoxAnimate`](#boxanimate)
-   [`Column`](#column)
-   [`EnemyOne`](#enemyone)
-   [`Scroll`](#scroll)
-   `EnemyCritical`
-   `EnemySpecial`
-   `EnemyTarget`
-   [`Keyboard`](#keyboard)

## Box

一个可以拖动的盒子，例如状态栏

-   参数（均为可选）
    -   `dragable`: 盒子是否可以拖动
    -   `resizeable`: 盒子是否可以自定义大小
    -   `v-model:left`: 盒子的左上角横坐标
    -   `v-model:top`: 盒子的左上角纵坐标
    -   `v-model:width`: 盒子的宽度
    -   `v-model:height`: 盒子的高度
-   插槽
    -   `default`: 盒子中显示的内容

## BoxAnimate

一个显示图块动画的组件，例如怪物手册中的怪物图标

-   参数
    -   `id`: 显示的图标 id
    -   `noboarder`: 可选，是否没有边框与背景
    -   `width`: 可选，图标的宽度，默认为 32
    -   `height`: 可选，图标的高度，默认为 32

## Column

一个分为两栏进行显示的组件，例如设置快捷键中左右两侧中左侧显示按键分组，右侧显示组别信息

-   参数（均为可选）
    -   `width`: 组件整体的宽度，占画面的百分比，一般不建议超过 90
    -   `height`: 组件整体的高度，占画面的百分比，一般不建议超过 90
    -   `left`: 左侧栏占比，范围 0-100
    -   `right`: 右侧栏占比，范围 0-100
-   事件
    -   `close`: 当点击左上角的返回后触发这个事件
-   插槽
    -   `left`: 左侧栏显示的内容
    -   `right`: 右侧栏显示的内容

## EnemyOne

显示单个怪物信息，就是怪物手册中的单个怪物信息

-   参数
    -   `enemy`: 怪物信息，类型为 `ToShowEnemy`
    -   `selected`: 这个怪物是否被选中
-   事件
    -   `hover`: 当鼠标放到这个怪物身上或在怪物身上移动时触发
    -   `select`: 当选中这个怪物时触发

## Scroll

滚动条组件，例如状态栏等

-   参数（均为可选）
    -   `v-model:now`: 当前滚动条位置
    -   `type`: 滚动条模式，`horizontal` 还是 `vertical`，默认为竖直，即 `vertical`
    -   `v-model:drag`: 是否正在拖动
    -   `width`: 滚动条的宽度
    -   `v-model:update`: 取反以更新滚动条信息
    -   `noScroll`: 不显示滚动条，例如状态栏
-   插槽
    -   `default`: 滚动条内的显示内容

## Keyboard

虚拟键盘组件

-   参数
    -   `keyboard`: 要显示哪个虚拟键盘
