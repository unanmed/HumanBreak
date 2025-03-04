import { logger } from '@motajs/common';
import { ERenderItemEvent, RenderItem } from '@motajs/render-core';
import { ETextEvent, Text, Comment } from '@motajs/render-elements';
import {
    ComponentInternalInstance,
    createRenderer,
    ElementNamespace,
    VNodeProps
} from 'vue';
import { tagMap } from './map';

export const { createApp, render } = createRenderer<RenderItem, RenderItem>({
    patchProp: function (
        el: RenderItem,
        key: string,
        prevValue: any,
        nextValue: any,
        namespace?: ElementNamespace,
        parentComponent?: ComponentInternalInstance | null
    ): void {
        el.patchProp(key, prevValue, nextValue, namespace, parentComponent);
    },

    insert: function (
        el: RenderItem<ERenderItemEvent>,
        parent: RenderItem,
        _anchor?: RenderItem<ERenderItemEvent> | null
    ): void {
        parent.appendChild(el);
    },

    remove: function (el: RenderItem<ERenderItemEvent>): void {
        el.remove();
    },

    createElement: function (
        type: string,
        namespace?: ElementNamespace,
        isCustomizedBuiltIn?: string,
        vnodeProps?: (VNodeProps & { [key: string]: any }) | null
    ): RenderItem {
        const onCreate = tagMap.get(type);
        if (!onCreate) {
            logger.error(20, type);
            throw new Error(`Cannot create element '${type}'`);
        }
        return onCreate(namespace, isCustomizedBuiltIn, vnodeProps);
    },

    createText: function (text: string): RenderItem<ETextEvent> {
        if (/^\s*$/.test(text)) {
            return new Comment();
        } else {
            logger.warn(38);
        }
        return new Text(text);
    },

    createComment: function (text: string): RenderItem<ERenderItemEvent> {
        return new Comment(text);
    },

    setText: function (node: RenderItem<ERenderItemEvent>, text: string): void {
        if (node instanceof Text) {
            node.setText(text);
        } else {
            logger.warn(39);
        }
    },

    setElementText: function (node: RenderItem, text: string): void {
        if (node instanceof Text) {
            node.setText(text);
        } else {
            logger.warn(39);
        }
    },

    parentNode: function (
        node: RenderItem<ERenderItemEvent>
    ): RenderItem | null {
        return node.parent ?? null;
    },

    nextSibling: function (
        node: RenderItem<ERenderItemEvent>
    ): RenderItem<ERenderItemEvent> | null {
        if (!node) return null;
        if (!node.parent) {
            return null;
        } else {
            const parent = node.parent;
            const list = [...parent.children];
            const index = list.indexOf(node);
            return list[index] ?? null;
        }
    }
});
