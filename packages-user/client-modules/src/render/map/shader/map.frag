#version 300 es
precision highp float;
precision highp sampler2DArray;

in vec4 v_texCoord;

out vec4 outColor;

uniform sampler2DArray u_sampler;

void main() {
    vec4 texColor = texture(u_sampler, v_texCoord.xyz);
    outColor = vec4(texColor.rgb, texColor.a * v_texCoord.a);
    // outColor = vec4(texColor.a * 0.001, v_texCoord.x * 6.0, v_texCoord.y * 0.0, v_texCoord.a);
}
