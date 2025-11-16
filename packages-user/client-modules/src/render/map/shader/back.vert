#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_texCoord;

out vec3 v_texCoord;

uniform float u_nowFrame;
uniform mat3 u_transform;

void main() {
    // 背景图永远是全图都画，因此变换矩阵应该作用于纹理坐标
    vec3 texCoord = vec3(a_texCoord, 1.0);
    vec3 transformed = u_transform * texCoord;
    v_texCoord = vec3(transformed.xy, u_nowFrame);
    gl_Position = vec4(a_position, 0.0, 1.0);
}
