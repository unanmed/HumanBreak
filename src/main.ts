import { createApp } from 'vue';
import App from './App.vue';
import App2 from './App2.vue';
import './styles.less';
import 'ant-design-vue/dist/antd.dark.css';
import './core/index';

createApp(App).mount('#root');
createApp(App2).mount('#root2');

main.init('play');
main.listen();
