<template>
    <div id="tools">
        <span class="button-text" @click="exit"><left-outlined /> 返回</span>
    </div>
    <div id="tool-editor">
        <div id="tool-left">
            <Scroll class="tool-list-scroll">
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
                            @click.stop="deleteTool(item.id)"
                            >删除</a-button
                        >
                    </div>
                    <div id="tool-list-add">
                        <div
                            id="tool-add-div"
                            @click="addingTool = true"
                            v-if="!addingTool"
                        >
                            <PlusOutlined></PlusOutlined>&nbsp;&nbsp;
                            <span>新增工具栏</span>
                        </div>
                        <div v-else>
                            <a-input
                                style="
                                    height: 100%;
                                    font-size: 80%;
                                    width: 100%;
                                "
                                v-model:value="addingToolId"
                                @blur="addTool"
                            ></a-input>
                        </div>
                    </div>
                </div>
            </Scroll>
            <a-divider
                type="vertical"
                dashed
                v-if="isMobile"
                style="height: 100%; border-color: #ddd4"
            ></a-divider>
            <div id="tool-preview" v-if="!!bar && isMobile">
                <div id="tool-preview-container">
                    <div class="tool-preview-item" v-for="item of bar.items">
                        <component
                            :is="(CustomToolbar.info[item.type].show as any)"
                            :item="item"
                            :toolbar="bar"
                        ></component>
                    </div>
                </div>
            </div>
        </div>
        <a-divider
            class="divider"
            dashed
            style="border-color: #ddd4"
            :type="isMobile ? 'horizontal' : 'vertical'"
        ></a-divider>
        <div id="tool-info">
            <div id="tool-detail" v-if="!!bar">
                <Scroll class="tool-item-list-scroll">
                    <div class="tool-item-list">
                        <div
                            class="tool-item-list-item"
                            v-for="item of bar.items"
                        >
                            <div
                                class="tool-item-header"
                                :folded="!unfolded[item.id]"
                                @click="triggerFold(item.id)"
                            >
                                <div
                                    style="
                                        display: flex;
                                        flex-direction: row;
                                        width: 100%;
                                    "
                                >
                                    <span
                                        class="tool-fold"
                                        :folded="!unfolded[item.id]"
                                    >
                                        <RightOutlined></RightOutlined>
                                    </span>
                                    <span class="tool-name">
                                        <span
                                            v-if="editId !== item.id"
                                            style="cursor: text"
                                            @click.stop="editName(item.id)"
                                        >
                                            {{ item.id }}
                                        </span>
                                        <span v-else>
                                            <a-input
                                                @blur="editNameSuccess(item.id)"
                                                @click.stop=""
                                                v-model:value="editValue"
                                                class="tool-name-edit"
                                            ></a-input>
                                        </span>
                                    </span>
                                </div>
                                <a-button
                                    type="danger"
                                    class="tool-item-delete"
                                    @click.stop="deleteItem(item)"
                                    >删除</a-button
                                >
                            </div>
                            <div v-if="!!unfolded[item.id]">
                                <component
                                    :is="CustomToolbar.info[item.type].editor"
                                    :item="item"
                                    :toolbar="bar"
                                ></component>
                            </div>
                        </div>
                        <div id="tool-item-add">
                            <div
                                id="tool-item-add-div"
                                v-if="!addingItem"
                                @click="addingItem = true"
                            >
                                <PlusOutlined></PlusOutlined>&nbsp;&nbsp;
                                <span>新增工具</span>
                            </div>
                            <div id="tool-item-add-type" v-else>
                                <span>工具类型</span>
                                <a-select
                                    v-model:value="addingType"
                                    style="
                                        width: 120px;
                                        height: 100%;
                                        font-size: 80%;
                                        background-color: #222;
                                    "
                                >
                                    <a-select-option
                                        v-for="(
                                            info, type
                                        ) of CustomToolbar.info"
                                        :value="type"
                                        >{{ info.name }}</a-select-option
                                    >
                                </a-select>
                                <a-button
                                    type="primary"
                                    style="font-size: 80%; height: 100%"
                                    @click="addItem(true)"
                                    >确定</a-button
                                >
                                <a-button
                                    @click="addItem(false)"
                                    style="
                                        background-color: #222;
                                        font-size: 80%;
                                        height: 100%;
                                    "
                                    >取消</a-button
                                >
                            </div>
                        </div>
                    </div>
                </Scroll>
            </div>
            <a-divider dashed v-if="!isMobile"></a-divider>
            <div id="tool-preview" v-if="!!bar && !isMobile">
                <div id="tool-preview-container">
                    <div class="tool-preview-item" v-for="item of bar.items">
                        <component
                            :is="(CustomToolbar.info[item.type].show as any)"
                            :item="item"
                            :toolbar="bar"
                        ></component>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { CustomToolbar } from '@/core/main/custom/toolbar';
import { GameUi } from '@/core/main/custom/ui';
import { computed, onUnmounted, reactive, ref } from 'vue';
import {
    PlusOutlined,
    RightOutlined,
    LeftOutlined
} from '@ant-design/icons-vue';
import { mainUi } from '@/core/main/init/ui';
import { isMobile } from '@/plugin/use';
import Scroll from '@/components/scroll.vue';
import { deleteWith, tip } from '@/plugin/utils';
import { Modal } from 'ant-design-vue';
import { mainSetting } from '@/core/main/setting';
import { ToolbarItemType } from '@/core/main/init/toolbar';

const props = defineProps<{
    ui: GameUi;
    num: number;
}>();

const scale = mainSetting.getValue('ui.toolbarScale', 100) / 100;

const list = CustomToolbar.list;

const selected = ref(0);
const bar = computed(() => list[selected.value]);

const unfolded = reactive<Record<string, boolean>>({});
const editId = ref<string>();
const editValue = ref<string>();

// 添加自定义工具
const addingItem = ref(false);
const addingType = ref<ToolbarItemType>('item');

// 添加自定义工具栏
const addingTool = ref(false);
const addingToolId = ref('');

/**
 * 编辑名称
 */
function editName(id: string) {
    editId.value = id;
    editValue.value = id;
}

/**
 * 编辑名称完成
 */
function editNameSuccess(id: string) {
    if (bar.value.items.some(v => v.id === editId.value)) {
        tip('error', '名称重复！');
    } else {
        const item = bar.value.items.find(v => v.id === id)!;
        item.id = editValue.value!;
    }
    editId.value = void 0;
    editValue.value = void 0;
}

/**
 * 删除自定义工具
 */
function deleteItem(item: any) {
    Modal.confirm({
        title: '确定要删除这个自定义工具吗？',
        onOk() {
            deleteWith(bar.value.items, item);
        },
        onCancel() {}
    });
}

function addItem(add: boolean) {
    if (add) {
        bar.value.add(
            // @ts-ignore
            CustomToolbar.info[addingType.value].onCreate({
                id: `tool-item-${bar.value.items.length}`,
                type: addingType.value
            })
        );
    }
    addingItem.value = false;
    addingType.value = 'item';
}

/**
 * 更改折叠
 */
function triggerFold(id: string) {
    unfolded[id] = !unfolded[id];
}

function exit() {
    mainUi.close(props.num);
}

function deleteTool(id: string) {
    Modal.confirm({
        title: '确定要删除这个自定义工具栏吗？',
        onOk() {
            const index = CustomToolbar.list.findIndex(v => v.id === id);
            if (index !== -1) {
                CustomToolbar.list[index].closeAll();
                CustomToolbar.list.splice(index, 1);
            }
            selected.value = 0;
        },
        onCancel() {}
    });
}

function addTool() {
    if (addingToolId.value === '') {
        addingToolId.value = '';
        addingTool.value = false;
        return;
    }
    if (CustomToolbar.list.some(v => v.id === addingToolId.value)) {
        tip('error', '工具栏名称重复！');
        return;
    } else {
        const bar = new CustomToolbar(addingToolId.value);
    }
    addingToolId.value = '';
    addingTool.value = false;
}

onUnmounted(() => {
    CustomToolbar.save();
});
</script>

<style lang="less" scoped>
#tools {
    width: 100%;
    font-family: 'normal';
    font-size: 3.2vh;
    height: 5vh;
    position: fixed;
    left: 10vw;
    top: 5vh;
}

#tool-editor {
    width: 70%;
    height: 70%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'normal';
    font-size: 150%;
    user-select: none;
    align-self: center;
}

.tool-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.tool-list-scroll {
    height: 100%;
    width: 100%;
}

#tool-left {
    flex-basis: 30%;
    display: flex;
    height: 100%;
}

#tool-list {
    display: flex;
    flex-direction: column;
    height: 100%;
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
    height: 100%;
    width: 70%;
}

#tool-detail {
    height: 60%;

    .tool-item-header {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
    }

    .tool-item-header[folded='false'] {
        border-bottom: 0.5px solid #888;
    }

    .tool-item-list-scroll {
        height: 100%;
        width: 100%;
    }

    .tool-item-list {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .tool-item-list-item {
        border: 1px solid #ddd8;
        margin-bottom: 3%;
        background-color: #222;
        padding-left: 2%;
    }

    .tool-fold {
        ::v-deep(span) {
            transition: all 0.2s ease;
        }
    }

    .tool-fold[folded='false'] {
        ::v-deep(span) {
            transform: rotate(90deg);
        }
    }

    .tool-name {
        margin-left: 3%;
        width: 40%;
        display: flex;

        .tool-name-edit {
            width: 100%;
            font-size: 100%;
            height: 100%;
            background-color: #000;
        }
    }

    .tool-item-delete {
        height: 100%;
        justify-self: end;
        font-size: 80%;
        padding: 2px 15px;
    }

    #tool-item-add-div {
        padding: 1% 3% 1% 3%;
        display: flex;
        align-items: center;
        flex-direction: row;
        cursor: pointer;
        padding: 1% 4%;
        transition: background-color linear 0.1s;
        border-radius: 5px;
        text-overflow: ellipsis;
    }

    #tool-item-add-div:hover {
        background-color: rgba(39, 251, 209, 0.316);
    }

    #tool-item-add-div:active {
        background-color: rgba(39, 251, 209, 0.202);
    }

    #tool-item-add-type {
        display: flex;
        align-items: center;
        flex-direction: row;
        padding: 1% 4%;
        justify-content: space-between;
        border-radius: 5px;
        background-color: rgba(39, 251, 209, 0.316);
    }
}

#tool-preview {
    height: 40%;
    display: flex;
    justify-content: center;
    align-items: flex-start;

    #tool-preview-container {
        width: 90%;
        display: flex;
        flex-direction: row;
        border: 2px solid #ddd9;
        background-color: #0009;
        flex-wrap: wrap;
    }

    .tool-preview-item {
        display: flex;
        margin: v-bind('5 * scale + "px"');
        min-width: v-bind('50 * scale + "px"');
        min-height: v-bind('50 * scale + "px"');
        background-color: #222;
        border: 1.5px solid #ddd8;
        justify-content: center;
        align-items: center;
        transition: all 0.1s linear;

        ::v-deep(*) {
            pointer-events: none;
        }
    }
}

.divider {
    height: 100%;
}

@media screen and (max-width: 600px) {
    #tool-editor {
        padding-top: 15%;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }

    #tool-left {
        width: 100%;
        flex-basis: 40%;
        max-height: 40vh;
        display: flex;
        flex-direction: row;

        .tool-list-scroll {
            height: 100%;
            flex-basis: 50%;
        }

        #tool-preview {
            flex-basis: 50%;
            height: 100%;
        }
    }

    #tool-info {
        width: 100%;
        flex-basis: 60%;

        #tool-detail {
            height: 100%;
        }
    }

    .divider {
        height: auto;
        width: 100%;
    }
}
</style>
