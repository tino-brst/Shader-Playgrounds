precision mediump float;

uniform sampler2D textureSampler;

varying vec2 fragmentTextureCoordinates;

void main() {
	gl_FragColor = vec4(texture2D(textureSampler, fragmentTextureCoordinates).rgb, 1.0);
}
