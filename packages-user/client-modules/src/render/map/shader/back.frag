#version 300 es
precision highp float;

in vec3 v_texCoord;
out vec4 outColor;

uniform sampler2DArray u_sampler;

void main() {
    outColor = texture(u_sampler, v_texCoord);
}
