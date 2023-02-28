///<reference path="../../src/types/core.d.ts" />

var plugins_bb40132b_638b_4a9f_b028_d3fe47acc8d1 = {
    init: function () {
        // 这看不到插件，插件全放到plugin文件夹里面了，要看的话去 关于游戏 的开源地址里面看
        // 直接把仓库clone下来，或者下载zip都行
        // 脚本编辑同理
        this._afterLoadResources = function () {};
    },
    pluginUtils: function () {
        // 保留这个函数，以保证main.js能够使用
        this.maxGameScale = function (n = 0) {
            const index = core.domStyle.availableScale.indexOf(
                core.domStyle.scale
            );
            core.control.setDisplayScale(
                core.domStyle.availableScale.length - 1 - index - n
            );
            if (!core.isPlaying() && core.flags.enableHDCanvas) {
                core.domStyle.ratio = Math.max(
                    window.devicePixelRatio || 1,
                    core.domStyle.scale
                );
                core.resize();
            }
        };
    }
};
