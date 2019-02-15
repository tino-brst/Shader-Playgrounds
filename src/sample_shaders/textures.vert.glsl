uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 vertexPosition;
attribute vec2 vertexTextureCoordinates;

varying vec2 fragmentTextureCoordinates;

void main() {
	fragmentTextureCoordinates = vertexTextureCoordinates;
	gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(vertexPosition, 1);
}