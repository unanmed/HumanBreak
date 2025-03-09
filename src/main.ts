import { createApp } from 'vue';
import './styles.less';
import { createGame } from '@user/entry-client';

// 创建游戏实例
createGame();

(async () => {
    const App = (await import('./App.vue')).default;
    createApp(App).mount('#root');
})();

main.init('play');
main.listen();
