import { DefaultProps } from '@/core/render';
import { defineComponent } from 'vue';

export interface ConfirmBoxProps extends DefaultProps {
    text: string;
    yesText?: string;
    noText?: string;
    winskin?: string;
}

export interface ConfirmBoxEmits {
    onYes: () => void;
    onNo: () => void;
}

export const ConfirmBox = defineComponent(() => {
    return () => <container></container>;
});
