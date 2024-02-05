import { createApp } from 'vue';
import './game/index';
import './core/index';
import App from './App.vue';
import './styles.less';
import 'ant-design-vue/dist/antd.dark.css';

export * from './game/system';

createApp(App).mount('#root');

main.init('play');
main.listen();
