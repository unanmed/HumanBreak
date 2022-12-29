import { ref } from 'vue';

export const chapterShowed = ref(false);
export const chapterContent = ref('');

export default function init() {
    return { chapterShowed, chapterContent };
}
