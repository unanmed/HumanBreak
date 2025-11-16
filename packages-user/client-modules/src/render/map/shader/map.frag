#version 300 es
precision highp float;
precision mediump uint;

in vec4 v_texCoord;

out vec4 outColor;

uniform sampler2DArray u_sampler;

void main() {
    vec4 texColor = texture(u_sampler, v_texCoord.xyz);
    outColor = vec4(texColor.rgb, texColor.a * v_texCoord.a);
}
