# @motajs/system

包含两个模块：

-   [Action](../motajs-system-action/index.md)
-   [UI](../motajs-system-ui/index.md)

## 引入示例

```ts
import { Action, UI } from '@motajs/system';

Action.gameKey.register(...);
const myController = new UI.UIController('my-controller');
```

等效于：

```ts
import { gameKey } from '@motajs/system-action';
import { UIController } from '@motajs/system-ui';

gameKey.register(...);
const myController = new UIController('my-controller');
```
