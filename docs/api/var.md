# 变量 API

此处列出所有的单个变量的 API，需要通过 `Mota.requireAll('var')` 获取

## loading

```ts
declare var loading: GameLoading
```

-   变量说明

    渲染进程变量，用于控制或监听游戏的加载进程

-   接口 `GameLoading`，继承自 [`EventEmitter`](./class/event-emitter.md)

    ```ts
    interface GameLoading extends EventEmitter {
        addMaterialLoaded(): void
        addAutotileLoaded(): void
        onAutotileLoaded(autotiles: Record<string, HTMLImageElement>)
    }
    ```

    -   接口说明

        以上三个方法一般都是没有调用的必要的，具体干什么的也不需要太在意，这个变量的主要功能是监听加载进程

    -   事件说明

        以下事件中的监听函数均没有参数或返回值

        -   `coreLoaded`: 当 `core.js` 加载完毕后触发
        -   `coreInit`: 当 `core` 初始化完毕后触发，大部分情况下，需要在游戏开始时执行的脚本都应当在这个时候执行

## hook

```ts
declare var hook: EventEmitter
```

-   变量说明

    渲染进程变量，一个用于监听事件的变量，目前包含的事件较少，包含以下事件，事件均没有参数和返回值

    -   `reset`: 当游戏初始化（每次读档和开始新游戏）时触发
    -   `mounted`: 当渲染进程的根组件挂载完毕后触发
    -   `statusBarUpdate`: 当状态栏更新时触发
    -   `renderLoaded`: 当渲染进程加载完毕后触发

## gameListener

```ts
declare var gameListener: GameListener
```

-   变量说明

    渲染进程变量，一个用于监听部分游戏操作的变量

-   接口 `GameListener`，继承自 [`EventEmitter`](./class/event-emitter.md)

    包含以下事件：

    -   `hoverBlock`

        ```ts
        interface ListenerEvent {
            hoverBlock: (block: Block, ev: MouseEvent) => void
        }
        ```

        当鼠标移动到一个图块上时触发，参数分别是移动到的图块，以及 dom 事件参数，手机端无效

    -   `leaveBlock`

        ```ts
        interface ListenerEvent {
            leaveBlock: (block: Block, ev: MouseEvent, leaveGame: boolean) => void
        }
        ```

        当鼠标离开一个图块上时触发，前两个参数与 `hoverBlock` 事件一致，第三个参数表明鼠标是否是由于离开游戏画面而离开的图块

    -   `clickBlock`

        ```ts
        interface ListenerEvent {
            clickBlock: (block: Block, ev: MouseEvent) => void
        }
        ```

        当鼠标点击一个图块时触发，参数与 `hoverBlock` 事件一致

    -   `mouseMove`

        ```ts
        interface ListenerEvent {
            mouseMove: (ev: MouseEvent) => void
        }
        ```

        当鼠标移动时触发

## mainSetting

```ts
declare var mainSetting: MotaSetting
```

-   变量说明

    渲染进程变量，系统设置变量，可以在道具 系统设置 中打开

## gameKey

```ts
declare var gameKey: Hotkey
```

-   变量说明

    渲染进程变量，系统按键控制系统，不建议创建新的 `Hotkey` 实例实现自己的按键，推荐直接在这个变量上新增自己的按键

## mainUi

```ts
declare var mainUi: UiController
```

-   变量说明

    渲染进程变量，主要 UI 控制器，UI 之间有嵌套关系

## fixedUi

```ts
declare var fixedUi: UiController
```

-   变量说明

    渲染进程变量，平等 UI 控制器，UI 之间无嵌套关系，且互不影响，参考[UI 控制](../guide/ui-control.md#mainui-与-fixedui)

## KeyCode

```ts
declare const enum KeyCode {
    // ...
}
```

-   变量说明

    渲染进程变量，摘自微软的 vscode 的 keyCodes.ts，描述了键盘上的所有按键，几乎不存在遗漏按键，注意对于一个键有两个功能的，例如 `1/!`，依然只会视为一个按键，以下是这个枚举从小到大的所有内容：

```ts
declare const enum KeyCode {
	DependsOnKbLayout = -1,

	/**
	 * Placed first to cover the 0 value of the enum.
	 */
	Unknown = 0,

	Backspace,
	Tab,
	Enter,
	Shift,
	Ctrl,
	Alt,
	PauseBreak,
	CapsLock,
	Escape,
	Space,
	PageUp,
	PageDown,
	End,
	Home,
	LeftArrow,
	UpArrow,
	RightArrow,
	DownArrow,
	Insert,
	Delete,

	Digit0,
	Digit1,
	Digit2,
	Digit3,
	Digit4,
	Digit5,
	Digit6,
	Digit7,
	Digit8,
	Digit9,

	KeyA,
	KeyB,
	KeyC,
	KeyD,
	KeyE,
	KeyF,
	KeyG,
	KeyH,
	KeyI,
	KeyJ,
	KeyK,
	KeyL,
	KeyM,
	KeyN,
	KeyO,
	KeyP,
	KeyQ,
	KeyR,
	KeyS,
	KeyT,
	KeyU,
	KeyV,
	KeyW,
	KeyX,
	KeyY,
	KeyZ,

	Meta,
	ContextMenu,

	F1,
	F2,
	F3,
	F4,
	F5,
	F6,
	F7,
	F8,
	F9,
	F10,
	F11,
	F12,
	F13,
	F14,
	F15,
	F16,
	F17,
	F18,
	F19,

	NumLock,
	ScrollLock,

	/**
	 * Used for miscellaneous characters; it can vary by keyboard.
	 * For the US standard keyboard, the ';:' key
	 */
	Semicolon,
	/**
	 * For any country/region, the '+' key
	 * For the US standard keyboard, the '=+' key
	 */
	Equal,
	/**
	 * For any country/region, the ',' key
	 * For the US standard keyboard, the ',<' key
	 */
	Comma,
	/**
	 * For any country/region, the '-' key
	 * For the US standard keyboard, the '-_' key
	 */
	Minus,
	/**
	 * For any country/region, the '.' key
	 * For the US standard keyboard, the '.>' key
	 */
	Period,
	/**
	 * Used for miscellaneous characters; it can vary by keyboard.
	 * For the US standard keyboard, the '/?' key
	 */
	Slash,
	/**
	 * Used for miscellaneous characters; it can vary by keyboard.
	 * For the US standard keyboard, the '`~' key
	 */
	Backquote,
	/**
	 * Used for miscellaneous characters; it can vary by keyboard.
	 * For the US standard keyboard, the '[{' key
	 */
	BracketLeft,
	/**
	 * Used for miscellaneous characters; it can vary by keyboard.
	 * For the US standard keyboard, the '\|' key
	 */
	Backslash,
	/**
	 * Used for miscellaneous characters; it can vary by keyboard.
	 * For the US standard keyboard, the ']}' key
	 */
	BracketRight,
	/**
	 * Used for miscellaneous characters; it can vary by keyboard.
	 * For the US standard keyboard, the ''"' key
	 */
	Quote,
	/**
	 * Used for miscellaneous characters; it can vary by keyboard.
	 */
	OEM_8,
	/**
	 * Either the angle bracket key or the backslash key on the RT 102-key keyboard.
	 */
	IntlBackslash,

	Numpad0, // VK_NUMPAD0, 0x60, Numeric keypad 0 key
	Numpad1, // VK_NUMPAD1, 0x61, Numeric keypad 1 key
	Numpad2, // VK_NUMPAD2, 0x62, Numeric keypad 2 key
	Numpad3, // VK_NUMPAD3, 0x63, Numeric keypad 3 key
	Numpad4, // VK_NUMPAD4, 0x64, Numeric keypad 4 key
	Numpad5, // VK_NUMPAD5, 0x65, Numeric keypad 5 key
	Numpad6, // VK_NUMPAD6, 0x66, Numeric keypad 6 key
	Numpad7, // VK_NUMPAD7, 0x67, Numeric keypad 7 key
	Numpad8, // VK_NUMPAD8, 0x68, Numeric keypad 8 key
	Numpad9, // VK_NUMPAD9, 0x69, Numeric keypad 9 key

	NumpadMultiply,	// VK_MULTIPLY, 0x6A, Multiply key
	NumpadAdd,		// VK_ADD, 0x6B, Add key
	NUMPAD_SEPARATOR,	// VK_SEPARATOR, 0x6C, Separator key
	NumpadSubtract,	// VK_SUBTRACT, 0x6D, Subtract key
	NumpadDecimal,	// VK_DECIMAL, 0x6E, Decimal key
	NumpadDivide,	// VK_DIVIDE, 0x6F,

	/**
	 * Cover all key codes when IME is processing input.
	 */
	KEY_IN_COMPOSITION,

	ABNT_C1, // Brazilian (ABNT) Keyboard
	ABNT_C2, // Brazilian (ABNT) Keyboard

	AudioVolumeMute,
	AudioVolumeUp,
	AudioVolumeDown,

	BrowserSearch,
	BrowserHome,
	BrowserBack,
	BrowserForward,

	MediaTrackNext,
	MediaTrackPrevious,
	MediaStop,
	MediaPlayPause,
	LaunchMediaPlayer,
	LaunchMail,
	LaunchApp2,

	/**
	 * VK_CLEAR, 0x0C, CLEAR key
	 */
	Clear,

	/**
	 * Placed last to cover the length of the enum.
	 * Please do not depend on this value!
	 */
	MAX_VALUE
}
```

## ScanCode

```ts
declare const enum ScanCode {
    // ...
}
```

-   变量说明

    渲染进程变量，与 [`KeyCode`](#keycode) 类似，每个按键几乎都有一个对于的值，不过这里与 `KeyboardEvent.code` 相对应：

```ts
declare const enum ScanCode {
    DependsOnKbLayout = -1,
	None,
	Hyper,
	Super,
	Fn,
	FnLock,
	Suspend,
	Resume,
	Turbo,
	Sleep,
	WakeUp,
	KeyA,
	KeyB,
	KeyC,
	KeyD,
	KeyE,
	KeyF,
	KeyG,
	KeyH,
	KeyI,
	KeyJ,
	KeyK,
	KeyL,
	KeyM,
	KeyN,
	KeyO,
	KeyP,
	KeyQ,
	KeyR,
	KeyS,
	KeyT,
	KeyU,
	KeyV,
	KeyW,
	KeyX,
	KeyY,
	KeyZ,
	Digit1,
	Digit2,
	Digit3,
	Digit4,
	Digit5,
	Digit6,
	Digit7,
	Digit8,
	Digit9,
	Digit0,
	Enter,
	Escape,
	Backspace,
	Tab,
	Space,
	Minus,
	Equal,
	BracketLeft,
	BracketRight,
	Backslash,
	IntlHash,
	Semicolon,
	Quote,
	Backquote,
	Comma,
	Period,
	Slash,
	CapsLock,
	F1,
	F2,
	F3,
	F4,
	F5,
	F6,
	F7,
	F8,
	F9,
	F10,
	F11,
	F12,
	PrintScreen,
	ScrollLock,
	Pause,
	Insert,
	Home,
	PageUp,
	Delete,
	End,
	PageDown,
	ArrowRight,
	ArrowLeft,
	ArrowDown,
	ArrowUp,
	NumLock,
	NumpadDivide,
	NumpadMultiply,
	NumpadSubtract,
	NumpadAdd,
	NumpadEnter,
	Numpad1,
	Numpad2,
	Numpad3,
	Numpad4,
	Numpad5,
	Numpad6,
	Numpad7,
	Numpad8,
	Numpad9,
	Numpad0,
	NumpadDecimal,
	IntlBackslash,
	ContextMenu,
	Power,
	NumpadEqual,
	F13,
	F14,
	F15,
	F16,
	F17,
	F18,
	F19,
	F20,
	F21,
	F22,
	F23,
	F24,
	Open,
	Help,
	Select,
	Again,
	Undo,
	Cut,
	Copy,
	Paste,
	Find,
	AudioVolumeMute,
	AudioVolumeUp,
	AudioVolumeDown,
	NumpadComma,
	IntlRo,
	KanaMode,
	IntlYen,
	Convert,
	NonConvert,
	Lang1,
	Lang2,
	Lang3,
	Lang4,
	Lang5,
	Abort,
	Props,
	NumpadParenLeft,
	NumpadParenRight,
	NumpadBackspace,
	NumpadMemoryStore,
	NumpadMemoryRecall,
	NumpadMemoryClear,
	NumpadMemoryAdd,
	NumpadMemorySubtract,
	NumpadClear,
	NumpadClearEntry,
	ControlLeft,
	ShiftLeft,
	AltLeft,
	MetaLeft,
	ControlRight,
	ShiftRight,
	AltRight,
	MetaRight,
	BrightnessUp,
	BrightnessDown,
	MediaPlay,
	MediaRecord,
	MediaFastForward,
	MediaRewind,
	MediaTrackNext,
	MediaTrackPrevious,
	MediaStop,
	Eject,
	MediaPlayPause,
	MediaSelect,
	LaunchMail,
	LaunchApp2,
	LaunchApp1,
	SelectTask,
	LaunchScreenSaver,
	BrowserSearch,
	BrowserHome,
	BrowserBack,
	BrowserForward,
	BrowserStop,
	BrowserRefresh,
	BrowserFavorites,
	ZoomToggle,
	MailReply,
	MailForward,
	MailSend,

	MAX_VALUE
}
```

## bgm

```ts
declare var bgm: BgmController
```

-   变量说明

    渲染进程变量，用于控制当前的 bgm 状态，参考 [类 BgmController](./class/bgm-controller.md)

## sound

```ts
declare var sound: SoundController
```

-   变量说明

    渲染进程变量，用于控制音效的播放，参考 [类 SoundController](./class/sound-controller.md)

## settingStorage

```ts
declare var settingStorage: GameStorage
```

-   变量说明

    渲染进程变量，用于保存所有的系统设置信息

## status

```ts
declare var status: { value: boolean }
```

-   变量说明

    渲染进程变量，用于控制状态栏刷新，取反后立刻刷新状态栏的显示

## enemySpecials

```ts
declare var enemySpecials: SpecialDeclaration[]
```

-   变量说明

    游戏进程变量，描述了所有特殊属性定义，示例参考插件
