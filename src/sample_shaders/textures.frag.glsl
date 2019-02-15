precision mediump float;

uniform sampler2D textureSampler_0;

varying vec2 fragmentTextureCoordinates;

void main() {
	gl_FragColor = vec4(texture2D(textureSampler_0, fragmentTextureCoordinates).rgb, 1.0);
}