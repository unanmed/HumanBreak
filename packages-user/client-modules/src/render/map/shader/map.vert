#version 300 es
precision highp float;
precision mediump uint;

in vec3 a_position;
in vec3 a_texCoord;
// x: 最大帧数，y: 偏移池索引，实例化绘制传入
in ivec2 a_offsetData;
// 不透明度，用于前景层虚化
in float a_alpha;

// x,y,z: 纹理坐标，w: 不透明度
out vec4 v_texCoord;

uniform vec2 u_offsetPool[$1];
uniform uint u_nowFrame;
uniform mat3 u_transform;

void main() {
    // 偏移量
    uint offset = mod(u_nowFrame, a_offsetData.x);
    float fOffset = float(offset);
    // 贴图坐标
    v_texCoord = vec4(a_texCoord.xy + u_offsetPool[a_offsetData.y] * fOffset, a_texCoord.z, a_alpha);
    gl_Position = vec4(u_transform * a_position, 1.0);
}
