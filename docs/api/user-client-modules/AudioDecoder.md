# AudioDecoder API 文档

本文档由 `DeepSeek R1` 模型生成并微调。

---

## 类描述

音频解码系统的核心抽象类，为不同音频格式提供统一的解码接口。主要处理浏览器原生不支持音频格式的解码任务（如 iOS 平台的 Ogg 格式）。

---

## 静态成员说明

### `decoderMap`

```typescript
declare const decoderMap: Map<AudioType, new () => AudioDecoder>;
```

解码器注册表，存储格式类型与解码器类的映射关系

---

## 静态方法说明

### `AudioDecoder.registerDecoder`

```typescript
function registerDecoder(
    type: AudioType,
    decoder: new () => AudioDecoder
): void;
```

注册自定义解码器到全局解码器系统

| 参数    | 类型                     | 说明           |
| ------- | ------------------------ | -------------- |
| type    | `AudioType`              | 音频格式类型   |
| decoder | `new () => AudioDecoder` | 解码器构造函数 |

---

### `AudioDecoder.decodeAudioData`

```typescript
function decodeAudioData(
    data: Uint8Array,
    player: AudioPlayer
): Promise<AudioBuffer | null>;
```

核心解码入口方法，自动选择最佳解码方案

| 参数   | 类型          | 说明             |
| ------ | ------------- | ---------------- |
| data   | `Uint8Array`  | 原始音频字节数据 |
| player | `AudioPlayer` | 音频播放器实例   |

**处理流程**：

1. 通过文件头检测音频类型
2. 优先使用浏览器原生解码能力
3. 无原生支持时查找注册的自定义解码器
4. 返回标准 `AudioBuffer` 格式数据

---

## 抽象方法说明

### `abstract create`

```typescript
function create(): Promise<void>;
```

初始化解码器实例（需分配 WASM 内存等资源）

---

### `abstract destroy`

```typescript
function destroy(): void;
```

销毁解码器实例（需释放资源）

---

### `abstract decode`

```typescript
function decode(data: Uint8Array): Promise<IAudioDecodeData | undefined>;
```

流式解码方法（分块处理）

| 参数 | 类型         | 说明         |
| ---- | ------------ | ------------ |
| data | `Uint8Array` | 音频数据分块 |

---

### `abstract decodeAll`

```typescript
function decodeAll(data: Uint8Array): Promise<IAudioDecodeData | undefined>;
```

全量解码方法（单次处理完整文件）

---

### `abstract flush`

```typescript
function flush(): Promise<IAudioDecodeData | undefined>;
```

冲刷解码器缓冲区，获取残留数据

---

## 数据结构

### IAudioDecodeData

```typescript
interface IAudioDecodeData {
    channelData: Float32Array[]; // 各声道 PCM 数据
    samplesDecoded: number; // 已解码采样数
    sampleRate: number; // 采样率 (Hz)
    errors: IAudioDecodeError[]; // 解码错误集合
}
```

## 内置解码器

-   `VorbisDecoder`: 解码 ogg vorbis 音频。
-   `OpusDecoder`: 解码 ogg opus 音频。
