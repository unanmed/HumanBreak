#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord;

out vec3 v_texCoord;

uniform float u_nowFrame;
uniform mat3 u_transform;

void main() {
    vec3 transformed = u_transform * vec3(a_position, 1.0);
    v_texCoord = vec3(a_texCoord, u_nowFrame);
    gl_Position = vec4(transformed.xy, 0.95, 1.0);
}
