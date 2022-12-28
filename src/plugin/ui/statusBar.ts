import { ref } from 'vue';

const status = ref(false);

export default function init() {
    return { statusBarStatus: status };
}

export { status };
