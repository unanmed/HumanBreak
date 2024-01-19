import { KeyCode } from '@/plugin/keyCodes';
import { Keyboard } from '../custom/keyboard';

const qweKey = new Keyboard('qwe'); // 字母键盘，A-Z
const numKey = new Keyboard('num'); // 数字键盘，1-0
const charKey = new Keyboard('charKey'); // 符号键盘，!@<>等
const fnKey = new Keyboard('fn'); // Fn键盘，F1-F12
const assistKey = new Keyboard('assist'); // 辅助键盘，tab,capslk,shift,ctrl等
const arrowKey = new Keyboard('arrow'); // 方向键
const numpadKey = new Keyboard('numpad'); // 小键盘
const mediaKey = new Keyboard('media'); // 媒体按键
const toolKey = new Keyboard('tool'); // Home,End,Insert,Delete,PageUp,PageDn

const mainKey = new Keyboard('main'); // 主键盘，不包含小键盘和方向键
const toolArrowKey = new Keyboard('toolArrow'); // 辅助键盘和方向键
const miniKey = new Keyboard('mini'); // 小键盘，包含媒体按键
const fullKey = new Keyboard('full'); // 全部键盘

qweKey
    .add({
        key: KeyCode.KeyQ,
        x: 0,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyW,
        x: 50,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyE,
        x: 100,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyR,
        x: 150,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyT,
        x: 200,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyY,
        x: 250,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyU,
        x: 300,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyI,
        x: 350,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyO,
        x: 400,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyP,
        x: 450,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyA,
        x: 10,
        y: 50,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyS,
        x: 60,
        y: 50,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyD,
        x: 110,
        y: 50,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyF,
        x: 160,
        y: 50,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyG,
        x: 210,
        y: 50,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyH,
        x: 260,
        y: 50,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyJ,
        x: 310,
        y: 50,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyK,
        x: 360,
        y: 50,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyL,
        x: 410,
        y: 50,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyZ,
        x: 40,
        y: 100,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyX,
        x: 90,
        y: 100,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyC,
        x: 140,
        y: 100,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyV,
        x: 190,
        y: 100,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyB,
        x: 240,
        y: 100,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyN,
        x: 290,
        y: 100,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.KeyM,
        x: 340,
        y: 100,
        width: 45,
        height: 45
    });

numKey
    .add({
        key: KeyCode.Backquote,
        x: 0,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>~<br />\`</span>`
    })
    .add({
        key: KeyCode.Digit1,
        x: 50,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>!<br />1</span>`
    })
    .add({
        key: KeyCode.Digit2,
        x: 100,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>@<br />2</span>`
    })
    .add({
        key: KeyCode.Digit3,
        x: 150,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>#<br />3</span>`
    })
    .add({
        key: KeyCode.Digit4,
        x: 200,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>\$<br />4</span>`
    })
    .add({
        key: KeyCode.Digit5,
        x: 250,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>%<br />5</span>`
    })
    .add({
        key: KeyCode.Digit6,
        x: 300,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>^<br />6</span>`
    })
    .add({
        key: KeyCode.Digit7,
        x: 350,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>&amp;<br />7</span>`
    })
    .add({
        key: KeyCode.Digit8,
        x: 400,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>*<br />8</span>`
    })
    .add({
        key: KeyCode.Digit9,
        x: 450,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>(<br />9</span>`
    })
    .add({
        key: KeyCode.Digit0,
        x: 500,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>)<br />0</span>`
    })
    .add({
        key: KeyCode.Minus,
        x: 550,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>—<br />-</span>`
    })
    .add({
        key: KeyCode.Equal,
        x: 600,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>+<br />=</span>`
    })
    .add({
        key: KeyCode.Backspace,
        x: 650,
        y: 0,
        width: 70,
        height: 45,
        text: `<span style='font-size: 60%'>Backspace</span>`
    });

charKey
    .add({
        key: KeyCode.BracketLeft,
        x: 110,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>{<br />[</span>`
    })
    .add({
        key: KeyCode.BracketRight,
        x: 160,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>}<br />]</span>`
    })
    .add({
        key: KeyCode.Backslash,
        x: 210,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>|<br />\\</span>`
    })
    .add({
        key: KeyCode.Semicolon,
        x: 70,
        y: 50,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>:<br />;</span>`
    })
    .add({
        key: KeyCode.Quote,
        x: 120,
        y: 50,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>"<br />'</span>`
    })
    .add({
        key: KeyCode.Comma,
        x: 0,
        y: 100,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>&lt;<br />,</span>`
    })
    .add({
        key: KeyCode.Period,
        x: 50,
        y: 100,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>&gt;<br />.</span>`
    })
    .add({
        key: KeyCode.Slash,
        x: 100,
        y: 100,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>?<br />/</span>`
    });

fnKey
    .add({
        key: KeyCode.Escape,
        x: 0,
        y: 0,
        width: 45,
        height: 45,
        text: `Esc`
    })
    .add({
        key: KeyCode.F1,
        x: 50 + 25,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.F2,
        x: 100 + 25,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.F3,
        x: 150 + 25,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.F4,
        x: 200 + 25,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.F5,
        x: 250 + 50,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.F6,
        x: 300 + 50,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.F7,
        x: 350 + 50,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.F8,
        x: 400 + 50,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.F9,
        x: 450 + 75,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.F10,
        x: 500 + 75,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.F11,
        x: 550 + 75,
        y: 0,
        width: 45,
        height: 45
    })
    .add({
        key: KeyCode.F12,
        x: 600 + 75,
        y: 0,
        width: 45,
        height: 45
    });

assistKey
    .add({
        key: KeyCode.Tab,
        x: 0,
        y: 0,
        width: 70,
        height: 45
    })
    .add({
        key: KeyCode.CapsLock,
        x: 0,
        y: 50,
        width: 80,
        height: 45,
        text: `<span style='font-size: 80%'>CapsLk</span>`
    })
    .add({
        key: KeyCode.Shift,
        x: 0,
        y: 100,
        width: 110,
        height: 45,
        text: `<span style='font-size: 80%'>Shift</span>`
    })
    .add({
        key: KeyCode.Ctrl,
        x: 0,
        y: 150,
        width: 75,
        height: 45,
        text: `<span style='font-size: 80%'>Ctrl</span>`
    })
    .add({
        key: KeyCode.Meta,
        x: 80,
        y: 150,
        width: 45,
        height: 45,
        text: /* html */ `<span style='font-size: 130%; display: flex; justify-content: center; align-items: center'>
    <svg style="width: 1em; height: 1em" viewbox="64 64 896 896" fill="currentColor">
        <path d="M523.8 191.4v288.9h382V128.1zm0 642.2l382 62.2v-352h-382zM120.1 480.2H443V201.9l-322.9 53.5zm0 290.4L443 823.2V543.8H120.1z" />
    </svg>
</span>`
    })
    .add({
        key: KeyCode.Alt,
        x: 130,
        y: 150,
        width: 70,
        height: 45,
        text: `<span style='font-size: 80%'>Alt</span>`
    })
    .add({
        key: KeyCode.Space,
        x: 205,
        y: 150,
        width: 320,
        height: 45,
        text: ``
    })
    .add({
        key: KeyCode.Alt,
        x: 530,
        y: 150,
        width: 70,
        height: 45,
        text: `<span style='font-size: 80%'>Alt</span>`
    })
    .add({
        key: KeyCode.Meta,
        x: 605,
        y: 150,
        width: 45,
        height: 45,
        text: /* html */ `<span style='font-size: 130%; display: flex; justify-content: center; align-items: center'>
    <svg style="width: 1em; height: 1em" viewbox="64 64 896 896" fill="currentColor">
        <path d="M523.8 191.4v288.9h382V128.1zm0 642.2l382 62.2v-352h-382zM120.1 480.2H443V201.9l-322.9 53.5zm0 290.4L443 823.2V543.8H120.1z" />
    </svg>
</span>`
    })
    .add({
        key: KeyCode.Ctrl,
        x: 655,
        y: 150,
        width: 65,
        height: 45,
        text: `<span style='font-size: 80%'>Ctrl</span>`
    })
    .add({
        key: KeyCode.Shift,
        x: 615,
        y: 100,
        width: 105,
        height: 45,
        text: `<span style='font-size: 80%'>Shift</span>`
    })
    .add({
        key: KeyCode.Enter,
        x: 635,
        y: 50,
        width: 85,
        height: 45,
        text: `<span style='font-size: 80%'>Enter</span>`
    });

arrowKey
    .add({
        key: KeyCode.UpArrow,
        x: 50,
        y: 0,
        width: 45,
        height: 45,
        text: `↑`
    })
    .add({
        key: KeyCode.LeftArrow,
        x: 0,
        y: 50,
        width: 45,
        height: 45,
        text: `←`
    })
    .add({
        key: KeyCode.DownArrow,
        x: 50,
        y: 50,
        width: 45,
        height: 45,
        text: `↓`
    })
    .add({
        key: KeyCode.RightArrow,
        x: 100,
        y: 50,
        width: 45,
        height: 45,
        text: `→`
    });

toolKey
    .add({
        key: KeyCode.Insert,
        x: 0,
        y: 60,
        width: 45,
        height: 45,
        text: `<span style='font-size: 70%'>Insert</span>`
    })
    .add({
        key: KeyCode.Delete,
        x: 0,
        y: 110,
        width: 45,
        height: 45,
        text: `<span style='font-size: 70%'>Delete</span>`
    })
    .add({
        key: KeyCode.Home,
        x: 50,
        y: 60,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>Home</span>`
    })
    .add({
        key: KeyCode.End,
        x: 50,
        y: 110,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>End</span>`
    })
    .add({
        key: KeyCode.PageUp,
        x: 100,
        y: 60,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>PgUp</span>`
    })
    .add({
        key: KeyCode.PageDown,
        x: 100,
        y: 110,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>PgDn</span>`
    })
    .add({
        key: KeyCode.ScrollLock,
        x: 0,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 80%'>ScrLk</span>`
    })
    .add({
        key: KeyCode.PauseBreak,
        x: 100,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 70%'>Pause<br />Break</span>`
    });

numpadKey
    .add({
        key: KeyCode.NumLock,
        x: 0,
        y: 0,
        width: 45,
        height: 45,
        text: `<span style='font-size: 70%'>NumLk</span>`
    })
    .add({
        key: KeyCode.NumpadDivide,
        x: 50,
        y: 0,
        width: 45,
        height: 45,
        text: `/`
    })
    .add({
        key: KeyCode.NumpadMultiply,
        x: 100,
        y: 0,
        width: 45,
        height: 45,
        text: `*`
    })
    .add({
        key: KeyCode.NumpadSubtract,
        x: 150,
        y: 0,
        width: 45,
        height: 45,
        text: `-`
    })
    .add({
        key: KeyCode.NumpadAdd,
        x: 150,
        y: 50,
        width: 45,
        height: 95,
        text: `+`
    })
    .add({
        key: KeyCode.Enter,
        x: 150,
        y: 150,
        width: 45,
        height: 95,
        text: `<span style='font-size: 80%'>Enter</span>`
    })
    .add({
        key: KeyCode.NumpadDecimal,
        x: 100,
        y: 200,
        width: 45,
        height: 45,
        text: `.`
    })
    .add({
        key: KeyCode.Numpad0,
        x: 0,
        y: 200,
        width: 95,
        height: 45,
        text: `0`
    })
    .add({
        key: KeyCode.Numpad7,
        x: 0,
        y: 50,
        width: 45,
        height: 45,
        text: `7`
    })
    .add({
        key: KeyCode.Numpad8,
        x: 50,
        y: 50,
        width: 45,
        height: 45,
        text: `8`
    })
    .add({
        key: KeyCode.Numpad9,
        x: 100,
        y: 50,
        width: 45,
        height: 45,
        text: `9`
    })
    .add({
        key: KeyCode.Numpad4,
        x: 0,
        y: 100,
        width: 45,
        height: 45,
        text: `4`
    })
    .add({
        key: KeyCode.Numpad5,
        x: 50,
        y: 100,
        width: 45,
        height: 45,
        text: `5`
    })
    .add({
        key: KeyCode.Numpad6,
        x: 100,
        y: 100,
        width: 45,
        height: 45,
        text: `6`
    })
    .add({
        key: KeyCode.Numpad1,
        x: 0,
        y: 150,
        width: 45,
        height: 45,
        text: `1`
    })
    .add({
        key: KeyCode.Numpad2,
        x: 50,
        y: 150,
        width: 45,
        height: 45,
        text: `2`
    })
    .add({
        key: KeyCode.Numpad3,
        x: 100,
        y: 150,
        width: 45,
        height: 45,
        text: `3`
    });

mediaKey
    .add({
        key: KeyCode.MediaPlayPause,
        x: 0,
        y: 0,
        width: 45,
        height: 45,
        text: /* html */ `<span style='font-size: 90%; display: flex; justify-content: center; align-items: center'>
    <svg style="width: 1em; height: 1em" viewbox="64 64 896 896" fill="currentColor">
        <path d="M715.8 493.5L335 165.1c-14.2-12.2-35-1.2-35 18.5v656.8c0 19.7 20.8 30.7 35 18.5l380.8-328.4c10.9-9.4 10.9-27.6 0-37z" />
    </svg>
    /
    <svg style="width: 1em; height: 1em" viewbox="64 64 896 896" fill="currentColor">
        <path d="M304 176h80v672h-80zm408 0h-64c-4.4 0-8 3.6-8 8v656c0 4.4 3.6 8 8 8h64c4.4 0 8-3.6 8-8V184c0-4.4-3.6-8-8-8z" />
    </svg>
</span>`
    })
    .add({
        key: KeyCode.MediaStop,
        x: 50,
        y: 0,
        width: 45,
        height: 45,
        text: /* html */ `<span style='font-size: 80%; display: flex; justify-content: center; align-items: center'>
    <svg style="width: 1em; height: 1em" viewbox="64 64 896 896" fill="currentColor">
        <rect x="0" y="0" width="100%" height="100%" />
    </svg>
</span>`
    })
    .add({
        key: KeyCode.MediaTrackPrevious,
        x: 100,
        y: 0,
        width: 45,
        height: 45,
        text: /* html */ `<span style='font-size: 110%; display: flex; justify-content: center; align-items: center'>
    <svg style="width: 1em; height: 1em" viewbox="64 64 896 896" fill="currentColor">
        <path d="M517.6 273.5L230.2 499.3a16.14 16.14 0 000 25.4l287.4 225.8c10.7 8.4 26.4.8 26.4-12.7V286.2c0-13.5-15.7-21.1-26.4-12.7zm320 0L550.2 499.3a16.14 16.14 0 000 25.4l287.4 225.8c10.7 8.4 26.4.8 26.4-12.7V286.2c0-13.5-15.7-21.1-26.4-12.7zm-620-25.5h-51.2c-3.5 0-6.4 2.7-6.4 6v516c0 3.3 2.9 6 6.4 6h51.2c3.5 0 6.4-2.7 6.4-6V254c0-3.3-2.9-6-6.4-6z" />
    </svg>
</span>`
    })
    .add({
        key: KeyCode.MediaTrackNext,
        x: 150,
        y: 0,
        width: 45,
        height: 45,
        text: /* html */ `<span style='font-size: 110%; display: flex; justify-content: center; align-items: center'>
    <svg style="width: 1em; height: 1em" viewbox="64 64 896 896" fill="currentColor">
        <path d="M793.8 499.3L506.4 273.5c-10.7-8.4-26.4-.8-26.4 12.7v451.6c0 13.5 15.7 21.1 26.4 12.7l287.4-225.8a16.14 16.14 0 000-25.4zm-320 0L186.4 273.5c-10.7-8.4-26.4-.8-26.4 12.7v451.5c0 13.5 15.7 21.1 26.4 12.7l287.4-225.8c4.1-3.2 6.2-8 6.2-12.7 0-4.6-2.1-9.4-6.2-12.6zM857.6 248h-51.2c-3.5 0-6.4 2.7-6.4 6v516c0 3.3 2.9 6 6.4 6h51.2c3.5 0 6.4-2.7 6.4-6V254c0-3.3-2.9-6-6.4-6z" />
    </svg>
</span>`
    });

toolArrowKey.extend(arrowKey, 0, 210).extend(toolKey, 0, 0);
miniKey.extend(numpadKey, 0, 0);

mainKey
    .extend(numKey, 0, 60)
    .extend(qweKey, 75, 110)
    .extend(charKey, 465, 110)
    .extend(fnKey, 0, 0)
    .extend(assistKey, 0, 110);

fullKey
    .extend(mainKey, 0, 0)
    .extend(toolArrowKey, 740, 0)
    .extend(miniKey, 905, 60)
    .extend(mediaKey, 905, 0);
