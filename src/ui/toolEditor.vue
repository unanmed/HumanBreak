<template>
    <Column :left="30" @close="exit">
        <template #left>
            <div id="tool-list">
                <div
                    v-for="(item, i) of list"
                    class="tool-list-item selectable"
                    :selected="i === selected"
                    @click="selected = i"
                >
                    <span>{{ item.id }}</span>
                    <a-button
                        type="danger"
                        class="tool-list-delete"
                        @click.stop="deleteTool"
                        >删除</a-button
                    >
                </div>
                <div id="tool-list-add">
                    <div id="tool-add-div" @click="addTool">
                        <PlusOutlined></PlusOutlined>&nbsp;&nbsp;
                        <span>新增工具栏</span>
                    </div>
                </div>
            </div>
        </template>
        <template #right>
            <div id="tool-info">
                <div id="tool-detail"></div>
                <a-divider dashed></a-divider>
                <div id="tool-preview">
                    <div id="tool-preview-container">
                        <div
                            class="tool-preview-item"
                            v-for="item of bar.items"
                        >
                            <component
                                :is="(item.com as any)"
                                :item="item"
                                :bar="bar"
                            ></component>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Column>
</template>

<script lang="ts" setup>
import { CustomToolbar } from '@/core/main/custom/toolbar';
import { GameUi } from '@/core/main/custom/ui';
import Column from '../components/colomn.vue';
import { computed, ref } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { mainUi } from '@/core/main/init/ui';

const props = defineProps<{
    ui: GameUi;
    num: number;
}>();

const list = CustomToolbar.list;

const selected = ref(0);
const bar = computed(() => list[selected.value]);

function exit() {
    mainUi.close(props.num);
}

function deleteTool() {}

function addTool() {}
</script>

<style lang="less" scoped>
.tool-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

#tool-list {
    display: flex;
    flex-direction: column;
}

#tool-list-add {
    margin-top: 5%;
    padding: 1% 3% 1% 3%;

    #tool-add-div {
        display: flex;
        align-items: center;
        flex-direction: row;
        cursor: pointer;
        padding: 1% 4%;
        transition: background-color linear 0.1s;
        border-radius: 5px;
        text-overflow: ellipsis;
    }

    #tool-add-div:hover {
        background-color: rgba(39, 251, 209, 0.316);
    }

    #tool-add-div:active {
        background-color: rgba(39, 251, 209, 0.202);
    }
}

.tool-list-delete {
    font-size: 80%;
    display: flex;
    align-items: center;
}

#tool-info {
    display: flex;
    flex-direction: column;
}

#tool-preview {
    display: flex;
    justify-content: center;
    align-items: center;

    #tool-preview-container {
        border: 2px solid #ddd9;
        background-color: #0009;
    }

    .tool-preview-item {
        ::v-deep(*) {
            pointer-events: none;
        }
    }
}
</style>
