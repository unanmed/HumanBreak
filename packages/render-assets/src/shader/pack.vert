#version 300 es
precision highp float;

in vec2 a_position;
in vec3 a_texCoord;

out vec3 v_texCoord;

void main() {
    v_texCoord = a_texCoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
