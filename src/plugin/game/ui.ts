// @ts-nocheck

export function init() {
    const { mainUi, fixedUi } = Mota.requireAll('var');

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
        core.clearRouteFolding();
        core.control.noAutoEvents = true;
        // 更新vue状态栏
        updateVueStatusBar();
        Mota.require('var', 'hook').emit('statusBarUpdate');
    };

    // todo: 多个状态栏分离与控制
    control.prototype.showStatusBar = function () {
        if (main.mode == 'editor') return;
        core.removeFlag('hideStatusBar');
        if (!fixedUi.hasName('statusBar')) {
            fixedUi.open('statusBar');
        }
        core.dom.tools.hard.style.display = 'block';
        core.dom.toolBar.style.display = 'block';
    };

    control.prototype.hideStatusBar = function (showToolbox) {
        if (main.mode == 'editor') return;

        // 如果原本就是隐藏的，则先显示
        if (!core.domStyle.showStatusBar) this.showStatusBar();
        if (core.isReplaying()) showToolbox = true;
        fixedUi.closeByName('statusBar');

        var toolItems = core.dom.tools;
        core.setFlag('hideStatusBar', true);
        core.setFlag('showToolbox', showToolbox || null);
        if (
            (!core.domStyle.isVertical && !core.flags.extendToolbar) ||
            !showToolbox
        ) {
            for (var i = 0; i < toolItems.length; ++i)
                toolItems[i].style.display = 'none';
        }
        if (!core.domStyle.isVertical && !core.flags.extendToolbar) {
            core.dom.toolBar.style.display = 'none';
        }
    };
}

function updateVueStatusBar() {
    Mota.r(() => {
        const status = Mota.require('var', 'status');
        status.value = !status.value;
    });
}
