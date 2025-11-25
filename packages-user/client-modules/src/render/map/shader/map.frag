#version 300 es
precision highp float;
precision highp sampler2DArray;

in vec4 v_texCoord;

out vec4 outColor;

uniform sampler2DArray u_sampler;

void main() {
    vec4 texColor = texture(u_sampler, v_texCoord.xyz);
    float alpha = texColor.a * v_texCoord.a;
    // todo: 透明像素应该如何解决？？
    if (alpha < 0.1) discard;
    outColor = vec4(texColor.rgb, alpha);
}
