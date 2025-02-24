// @ts-nocheck

export function init() {
    if (main.mode === 'editor') return;
    const { mainUi, fixedUi, mainSetting } = Mota.requireAll('var');
    const CustomToolbar = Mota.require('class', 'CustomToolbar');

    ui.prototype.drawBook = function () {
        if (!core.isReplaying()) return mainUi.open('book');
    };

    ui.prototype._drawToolbox = function () {
        if (!core.isReplaying()) return mainUi.open('toolbox');
    };

    ui.prototype._drawEquipbox = function () {
        if (!core.isReplaying()) return mainUi.open('equipbox');
    };

    ui.prototype.drawFly = function () {
        if (!core.isReplaying()) return mainUi.open('fly');
    };

    control.prototype.updateStatusBar_update = function () {
        core.control.updateNextFrame = false;
        if (!core.isPlaying() || core.hasFlag('__statistics__')) return;
        core.control.controldata.updateStatusBar();
        if (!core.control.noAutoEvents) core.checkAutoEvents();
        core.control._updateStatusBar_setToolboxIcon();
        core.control.noAutoEvents = true;
        Mota.require('var', 'hook').emit('statusBarUpdate');
    };

    // todo: 多个状态栏分离与控制
    control.prototype.showStatusBar = function () {
        if (main.mode == 'editor') return;
        const defaultsTool = CustomToolbar.get('@defaults');
        core.removeFlag('hideStatusBar');
        if (!fixedUi.hasName('statusBar')) {
            fixedUi.open('statusBar');
        }
        defaultsTool?.show();
        if (mainSetting.getValue('ui.tips')) {
            if (!fixedUi.hasName('tips')) {
                fixedUi.open('tips');
            }
        }
    };

    control.prototype.hideStatusBar = function (showToolbox) {
        if (main.mode == 'editor') return;
        const defaultsTool = CustomToolbar.get('@defaults');

        // 如果原本就是隐藏的，则先显示
        if (!core.domStyle.showStatusBar) this.showStatusBar();
        if (core.isReplaying()) showToolbox = true;
        fixedUi.closeByName('statusBar');
        if (!showToolbox) {
            defaultsTool?.closeAll();
        }
        fixedUi.closeByName('tips');

        core.setFlag('hideStatusBar', true);
        core.setFlag('showToolbox', showToolbox || null);
    };
}
