import { createApp } from 'vue';
import App from './App.vue';
import './styles.less';
import { createGame } from '@user/entry-client';

createApp(App).mount('#root');

// 创建游戏实例
createGame();

main.init('play');
main.listen();
