# Logger

本文档由 `DeepSeek R1` 模型生成并微调。

## 属性说明

| 属性名    | 类型          | 默认值 | 说明                                                             |
| --------- | ------------- | ------ | ---------------------------------------------------------------- |
| `enabled` | `boolean`     | `true` | 控制日志输出是否启用。设为 `false` 可临时关闭日志输出。          |
| `level`   | `LogLevel`    | -      | 日志级别，决定输出的最低日志等级（通过构造函数传入，不可修改）。 |
| `info`    | `ILoggerInfo` | -      | 包含错误和警告信息的配置对象（通过构造函数传入，不可修改）。     |

## 方法说明

### `constructor`

```ts
function constructor(level: LogLevel, info: ILoggerInfo): Logger;
```

#### 描述

构造一个 `Logger` 实例。

#### 参数

-   `level`: 日志对象输出等级。
-   `info`: 日志内容。

### `error`

```ts
function error(code: number, ...params: string[]): void;
```

#### 描述

记录一个错误信息。

#### 参数

-   `code`: 错误代码，对应 `info.error` 中的键值。
-   `...params`: 替换错误信息中的占位符（如 $1, $2）的参数。

#### 行为

-   如果未找到对应 `code` 的错误信息，会触发 `error(16)` 表示代码未定义。
-   根据日志级别 `level` 决定是否输出到控制台

### `warn`

```ts
function warn(code: number, ...params: string[]): void;
```

#### 描述

记录一个警告信息。

#### 参数

-   `code`: 警告代码，对应 `info.warn` 中的键值。
-   `...params`: 替换警告信息中的占位符的参数。

#### 行为

-   如果未找到对应 `code` 的警告信息，会触发 `error(16)`。
-   仅在 `level <= LogLevel.WARNING` 时输出。

### `log`

```ts
function log(text: string): void;
```

#### 描述

记录一条普通日志。

#### 参数

`text`: 日志文本内容。

#### 行为

-   仅在 `level <= LogLevel.LOG` 时输出到控制台。

### `catch`

```ts
function catch<T>(fn: () => T): LoggerCatchReturns<T>;
```

#### 描述

捕获函数执行期间产生的日志信息，并抑制日志输出。

#### 参数

-   `fn`: 需要执行的函数。

#### 返回值

-   `ret`: 函数 `fn` 的返回值。
-   `info`: 捕获的日志信息数组。

#### 行为

-   执行期间会临时禁用日志输出，执行完成后恢复原有状态。

### `disable`

```ts
function disable(): void;
```

#### 描述

禁用日志输出（设置 `enabled = false`）。

### `enable`

```ts
function enable(): void;
```

#### 描述

启用日志输出（设置 `enabled = true`）。

## 接口说明

### `LoggerCatchInfo`

#### 结构

```ts
interface LoggerCatchInfo {
    /** 错误/警告代码（仅 error/warn 方法存在） */
    code?: number;
    /** 日志等级 */
    level: LogLevel;
    /** 解析后的完整信息 */
    message: string;
}
```

### `LoggerCatchReturns<T>`

#### 结构

```ts
interface LoggerCatchReturns<T> {
    /** 被捕获函数的返回值 */
    ret: T;
    /** 捕获的日志信息列表 */
    info: LoggerCatchInfo[];
}
```

## 使用示例

-   初始化 Logger

```ts
import { LogLevel, Logger } from './logger';

const logInfo = {
    error: {
        404: 'Page $1 not found.',
        500: 'Internal server error: $1'
    },
    warn: {
        101: 'Deprecated API: $1'
    }
};

const logger = new Logger(LogLevel.WARNING, logInfo);
```

-   记录错误

```ts
logger.error(404, 'home');
// 控制台输出: [ERROR Code 404] Page home not found.
```

-   记录警告

```ts
logger.warn(101, '/old-api');
// 控制台输出: [WARNING Code 101] Deprecated API: /old-api
```

-   捕获日志

```ts
const result = logger.catch(() => {
    logger.error(500, 'database timeout');
    return { success: false };
});

console.log(result.info[0].message); // "Internal server error: database timeout"
```

-   禁用日志

```ts
logger.disable();
logger.log('This will not be printed'); // 无输出
logger.enable();
```
