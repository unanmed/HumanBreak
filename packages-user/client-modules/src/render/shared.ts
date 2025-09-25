// 地图格子宽高，此处仅影响画面，不影响游戏内逻辑，游戏内逻辑地图大小请在 core.js 中修改
export const MAP_BLOCK_WIDTH = 15;
export const MAP_BLOCK_HEIGHT = 15;

// 地图像素宽高
export const MAP_WIDTH = 32 * MAP_BLOCK_WIDTH;
export const MAP_HEIGHT = 32 * MAP_BLOCK_HEIGHT;

// 状态栏像素宽高
export const STATUS_BAR_WIDTH = 180;
export const STATUS_BAR_HEIGHT = 32 * MAP_BLOCK_HEIGHT;
// 右侧状态栏的横坐标
export const RIGHT_STATUS_POS = STATUS_BAR_WIDTH + MAP_WIDTH;

// 是否启用右侧状态栏
export const ENABLE_RIGHT_STATUS_BAR = true;
export const STATUS_BAR_COUNT = ENABLE_RIGHT_STATUS_BAR ? 2 : 1;

// 游戏画面像素宽高，宽=地图宽度+状态栏宽度*状态栏数量
export const MAIN_WIDTH = MAP_WIDTH + STATUS_BAR_WIDTH * STATUS_BAR_COUNT;
export const MAIN_HEIGHT = MAP_HEIGHT;
