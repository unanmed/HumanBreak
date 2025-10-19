#version 300 es
precision highp float;
precision highp sampler2DArray;

in vec3 v_texCoord;
out vec4 outColor;

uniform sampler2DArray u_texArray;

void main() {
    outColor = texture(u_texArray, v_texCoord);
}
