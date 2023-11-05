<template>
    <div id="ui-new">
        <div id="ui-main">
            <div id="ui-list">
                <div class="ui-one" v-for="ui of mainUi.stack">
                    <component
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
import { hook } from '@/core/main/game';

onMounted(() => {
    hook.emit('mounted');
});
</script>

<style lang="less" scoped>
#ui {
    width: 90%;
    height: 90%;
    display: flex;
    justify-content: center;
    overflow: hidden;
}

#ui-new {
    width: 0;
    height: 0;
    left: 0;
    top: 0;
    position: fixed;
    overflow: visible;
    display: block;
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
}

#ui-list {
    width: 90%;
    height: 90%;
    overflow: hidden;
    position: relative;
    left: 0;
    top: 0;
}

.ui-one {
    width: 100%;
    height: 100%;
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
}

@media screen and (max-width: 600px) {
    #ui {
        width: 100%;
        height: 100%;
    }

    #ui-list {
        width: 100%;
        height: 100%;
    }
}
</style>
