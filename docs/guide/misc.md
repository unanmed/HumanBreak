# 零碎功能介绍

新样板中包含了很多零碎功能，这些功能比较细微，不适合单独开一个页面进行讲解，因此这里把这些零碎功能全部放到了这个页面

## html解析

有很多地方可以填写 html 字符串来实现解析 html：

1. 道具、装备描述：

    以 `!!html`开头，后面紧跟着 html 字符串即可实现将这些内容解析为 html，例如：

    ```text
    !!html<span style="color: red">这是一段红色的字</span>
    ```

2. 虚拟按键：

    注册虚拟按键时，按键的显示名称可以填写 html。例如 Win 键就是这么写的：

    ```html
    <span style='font-size: 130%; display: flex; justify-content: center; align-items: center'>
        <svg style="width: 1em; height: 1em" viewbox="64 64 896 896" fill="currentColor">
            <path d="M523.8 191.4v288.9h382V128.1zm0 642.2l382 62.2v-352h-382zM120.1 480.2H443V201.9l-322.9 53.5zm0 290.4L443 823.2V543.8H120.1z" />
        </svg>
    </span>
    ```

3. 设置：

    设置的说明也可以使用 html