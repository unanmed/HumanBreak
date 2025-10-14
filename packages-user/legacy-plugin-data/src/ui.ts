// @ts-nocheck

export function initUI() {
    if (main.mode === 'editor') return;
    if (!main.replayChecking) {
        const { mainUi, fixedUi, mainSetting } =
            Mota.require('@motajs/legacy-ui');

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

        control.prototype.showStatusBar = function () {
            if (main.mode === 'editor') return;
            core.removeFlag('hideStatusBar');
            if (mainSetting.getValue('ui.tips')) {
                if (!fixedUi.hasName('tips')) {
                    fixedUi.open('tips');
                }
            }
            core.updateStatusBar();
        };

        control.prototype.hideStatusBar = function (showToolbox) {
            if (main.mode === 'editor') return;

            // 如果原本就是隐藏的，则先显示
            if (!core.domStyle.showStatusBar) this.showStatusBar();
            if (core.isReplaying()) showToolbox = true;
            fixedUi.closeByName('tips');

            core.setFlag('hideStatusBar', true);
            core.setFlag('showToolbox', showToolbox || null);
            core.updateStatusBar();
        };
    }

    control.prototype.updateStatusBar_update = function () {
        core.control.updateNextFrame = false;
        if (!core.isPlaying() || core.hasFlag('__statistics__')) return;
        core.control.controldata.updateStatusBar();
        if (!core.control.noAutoEvents) core.checkAutoEvents();
        core.control._updateStatusBar_setToolboxIcon();
        core.control.noAutoEvents = true;
        Mota.require('@user/data-base').hook.emit('statusBarUpdate');
    };
}
