<template>
    <div id="ui">
        <div id="ui-main">
            <div id="ui-list">
                <div class="ui-one" v-for="(ui, index) of mainUi.stack">
                    <component
                        v-if="show(index)"
                        :is="ui.ui.component"
                        v-on="ui.vOn ?? {}"
                        v-bind="ui.vBind ?? {}"
                    ></component>
                </div>
            </div>
        </div>
        <div id="ui-fixed">
            <template v-for="ui of fixedUi.stack">
                <component
                    :is="ui.ui.component"
                    v-on="ui.vOn ?? {}"
                    v-bind="ui.vBind ?? {}"
                ></component>
            </template>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { mainUi, fixedUi } from './core/main/init/ui';

onMounted(() => {
    const { hook } = Mota.requireAll('var');
    hook.emit('mounted');
});

function show(index: number) {
    if (mainUi.show === 'all') return true;
    if (mainUi.show === 'end') return index === mainUi.stack.length - 1;
}
</script>

<style lang="less" scoped>
#ui {
    width: 0;
    height: 0;
    left: 0;
    top: 0;
    position: fixed;
    overflow: visible;
    display: block;
    font-family: 'normal';
}

#ui-main {
    width: 100vw;
    height: 100vh;
    display: none;
    justify-content: center;
    align-items: center;
    left: 0;
    top: 0;
    position: fixed;
    background-color: #000b;
    backdrop-filter: blur(5px);
    z-index: 1;
}

#ui-list {
    width: 90vw;
    height: 90vh;
    overflow: hidden;
    position: relative;
    left: 0;
    top: 0;
}

.ui-one {
    width: 90vw;
    height: 90vh;
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    justify-content: center;
}

#ui-fixed {
    position: fixed;
    width: 0;
    height: 0;
    overflow: visible;
    left: 0;
    top: 0;
    display: none;
    z-index: 0;
}
</style>
