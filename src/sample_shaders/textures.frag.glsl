precision mediump float;

uniform sampler2D colorTexture;

varying vec2 fragmentTextureCoordinates;

void main() {
	gl_FragColor = vec4(texture2D(colorTexture, fragmentTextureCoordinates).rgb, 1.0);
}
