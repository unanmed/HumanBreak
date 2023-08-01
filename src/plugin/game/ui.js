///<reference path="../../../src/types/core.d.ts" />
export {};

(function () {
    if (main.replayChecking)
        return (core.plugin.gameUi = {
            openItemShop: () => 0,
            showChapter: () => 0,
            openSkill: () => 0
        });

    function openItemShop(itemShopId) {
        if (!core.isReplaying()) {
            core.plugin.openedShopId = itemShopId;
            ancTe.plugin.ui.shopOpened.value = true;
        }
    }

    function updateVueStatusBar() {
        if (main.replayChecking) return;
        core.plugin.statusBarStatus.value = !core.plugin.statusBarStatus.value;
        ancTe.plugin.mark.checkMarkedEnemy();
    }

    ui.prototype.drawBook = function () {
        if (!core.isReplaying())
            return (ancTe.plugin.ui.bookOpened.value = true);
    };

    ui.prototype._drawToolbox = function () {
        if (!core.isReplaying())
            return (ancTe.plugin.ui.toolOpened.value = true);
    };

    ui.prototype._drawEquipbox = function () {
        if (!core.isReplaying())
            return (ancTe.plugin.ui.equipOpened.value = true);
    };

    ui.prototype.drawFly = function () {
        if (!core.isReplaying())
            return (ancTe.plugin.ui.flyOpened.value = true);
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
    };

    control.prototype.showStatusBar = function () {
        if (main.mode == 'editor') return;
        core.removeFlag('hideStatusBar');
        ancTe.plugin.ui.showStatusBar.value = true;
        core.dom.tools.hard.style.display = 'block';
        core.dom.toolBar.style.display = 'block';
    };

    control.prototype.hideStatusBar = function (showToolbox) {
        if (main.mode == 'editor') return;

        // 如果原本就是隐藏的，则先显示
        if (!core.domStyle.showStatusBar) this.showStatusBar();
        if (core.isReplaying()) showToolbox = true;
        ancTe.plugin.ui.showStatusBar.value = false;

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

    function showChapter(chapter) {
        if (core.isReplaying()) return;
        ancTe.plugin.chapter.chapterContent.value = chapter;
        ancTe.plugin.chapter.chapterShowed.value = true;
    }

    function openSkill() {
        if (core.isReplaying()) return;
        ancTe.plugin.ui.skillOpened.value = true;
    }

    core.plugin.gameUi = {
        openItemShop,
        openSkill,
        showChapter
    };
})();
