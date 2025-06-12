# @motajs/system

包含两个模块：

-   [`@motajs/system-action`](../motajs-system-action/index.md)
-   [`@motajs/system-ui`](../motajs-system-ui/index.md)

## 引入示例

```ts
import { gameKey, UIController } from '@motajs/system';

gameKey.register(...);
const myController = new UIController('my-controller');
```

等效于：

```ts
import { gameKey } from '@motajs/system-action';
import { UIController } from '@motajs/system-ui';

gameKey.register(...);
const myController = new UIController('my-controller');
```
