import { createApp } from 'vue';
import App from './App.vue';
import './styles.less';
import 'ant-design-vue/dist/antd.dark.css';
import './game/index';
import './core/index';

createApp(App).mount('#root');

main.init('play');
main.listen();
