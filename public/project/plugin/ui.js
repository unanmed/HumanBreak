'use strict';

(function () {
    if (main.replayChecking) return (core.plugin.gameUi = {});

    function openItemShop(itemShopId) {
        if (!main.replayChecking) {
            core.plugin.openedShopId = itemShopId;
            core.plugin.shopOpened.value = true;
        }
    }

    function updateVueStatusBar() {
        if (main.replayChecking) return;
        core.plugin.statusBarStatus.value = !core.plugin.statusBarStatus.value;
        core.checkMarkedEnemy();
    }

    ui.prototype.drawBook = function () {
        if (!core.isReplaying()) return (core.plugin.bookOpened.value = true);
    };

    ui.prototype._drawToolbox = function () {
        if (!core.isReplaying()) return (core.plugin.toolOpened.value = true);
    };

    ui.prototype._drawEquipbox = function () {
        if (!core.isReplaying()) return (core.plugin.equipOpened.value = true);
    };

    ui.prototype.drawFly = function () {
        if (!core.isReplaying()) return (core.plugin.flyOpened.value = true);
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
        core.plugin.showStatusBar.value = true;
        core.dom.tools.hard.style.display = 'block';
        core.dom.toolBar.style.display = 'block';
    };

    control.prototype.hideStatusBar = function (showToolbox) {
        if (main.mode == 'editor') return;

        // 如果原本就是隐藏的，则先显示
        if (!core.domStyle.showStatusBar) this.showStatusBar();
        if (core.isReplaying()) showToolbox = true;
        core.plugin.showStatusBar.value = false;

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
        core.plugin.chapterContent.value = chapter;
        core.plugin.chapterShowed.value = true;
    }

    function openSkill() {
        if (core.isReplaying()) return;
        core.plugin.skillOpened.value = true;
    }

    core.plugin.gameUi = {
        openItemShop,
        openSkill,
        showChapter
    };
})();
