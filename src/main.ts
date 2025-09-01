import { createApp } from 'vue';
import './styles.less';
import { createGame } from '@user/entry-client';
import App from './App.vue';

// 创建游戏实例
createGame();
createApp(App).mount('#root');

main.init('play');
main.listen();
