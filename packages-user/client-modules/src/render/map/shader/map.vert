#version 300 es
precision highp float;
precision mediump int;

// 顶点坐标
layout(location = 0) in vec4 a_position;
// 实例化数据
// 图块坐标
layout(location = 1) in vec4 a_tilePos;
// 贴图坐标
layout(location = 2) in vec4 a_texCoord;
// x: 纵深，y: 不透明度
layout(location = 3) in vec4 a_tileData;
// x: 当前帧数，负数表示使用 u_nowFrame，y: 最大帧数，z: 偏移池索引，w: 纹理数组索引
layout(location = 4) in vec4 a_texData;

// x,y,z: 纹理坐标，w: 不透明度
out vec4 v_texCoord;

uniform float u_offsetPool[$1];
uniform float u_nowFrame;
uniform mat3 u_transform;

void main() {
    // 坐标
    vec2 pos = a_position.xy * a_tilePos.zw + a_tilePos.xy;
    vec2 texCoord = a_position.zw * a_texCoord.zw + a_texCoord.xy;
    // 偏移量
    float offset = mod(a_texData.x < 0.0 ? u_nowFrame : a_texData.x, a_texData.y);
    int offsetIndex = int(a_texData.z);
    // 贴图偏移
    texCoord.x += u_offsetPool[offsetIndex] * offset;
    v_texCoord = vec4(texCoord.xy, a_texData.w, a_tileData.y);
    vec3 transformed = u_transform * vec3(pos.xy, 1.0);
    gl_Position = vec4(transformed.xy, a_tileData.x, 1.0);
}
