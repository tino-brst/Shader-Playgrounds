export default `precision mediump float;

struct Light {
    vec3 position;
    vec3 color;
};

uniform mat4 viewMatrix;
uniform mat3 superMatrix;
uniform vec3 potatoPosition;
uniform Light light;
uniform Surface surface;

varying vec4 fragmentPosition;
varying vec3 fragmentNormal;

int decimal = 176;
int octal = 0176;
int hex = 0x176;

float a = 1.;
float a = 0.3421;
float a = 2e4;
float a = 2.45e-2;
float a = .12;

void main() {

    /* Modelo de Iluminacion de Phong */

    bool biggerThanZero = ( 2 > 4 ) ? true : false;

    // Calculos preliminares
    vec3 L = normalize(vec3(viewMatrix * vec4(light.position, 1.0)) - vec3(fragmentPosition));
    vec3 N = fragmentNormal;
    vec3 R = reflect(-L, N);
    vec3 V = normalize(-vec3(fragmentPosition));
    float LdotN = max(dot(L, N), 0.0);
    float RdotV = max(dot(R, V), 0.0);

    // Componente Ambiente
    vec3 ambient = light.color * surface.ambient;

    // Componente Difusa
    vec3 diffuse = light.color * surface.diffuse * LdotN;

    // Componente Especular
    vec3 specular = vec3(0.0, 0.0, 0.0);
    // se calcula solo si le da la luz, i.e. LdotN > 0
    if (LdotN > 0.0) {
        specular = light.color * surface.specular * pow(RdotV, surface.shininess);
    }

    // Color de salida
    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);

}`
