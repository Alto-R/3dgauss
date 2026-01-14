import { AdditiveBlending, BufferGeometry, Color, ColorRepresentation, DoubleSide, Float32BufferAttribute, Group, Material, Mesh, ShaderChunk, ShaderMaterial, UniformsLib, UniformsUtils, Vector3 } from 'three';

import type { Feature, LineString } from 'geojson';
import { getFeatureData, SourceInfo, type FeatureData } from '../geometry/geojson';
import { mergeGeometries } from '../geometry/BufferGeometryUtils';

export type FenceOptions = {
    material?: Material | string | undefined;
    color?: ColorRepresentation | undefined;
    opacity?: number | undefined;
    num?: number | undefined;
    speed?: number | undefined;
    height?: number | undefined;

    getElevation?: (feature: Feature) => number | number | undefined;
};

export function createFenceGeometryFromLine(line: LineString, height: number): BufferGeometry {
    const points = line.coordinates;
    const positions = [] as Array<any>;
    const uvs = [] as Array<any>;
    let j = positions.length;
    let t = uvs.length;
    let offset = 0;
    for (let i = 0; i < points.length - 1; i++) {
        let vUvyMax = 1;
        let left = points[i];
        let right = points[i + 1];

        const distance = Math.sqrt((left[0] - right[0]) * (left[0] - right[0]) + (left[1] - right[1]) * (left[1] - right[1])) / height;
        const uvxleft = offset;
        const uvxright = offset + distance;

        positions[j++] = left[0];
        positions[j++] = left[1];
        positions[j++] = left[2] + 0;
        uvs[t++] = uvxleft;
        uvs[t++] = 0;

        positions[j++] = right[0];
        positions[j++] = right[1];
        positions[j++] = right[2] + 0;
        uvs[t++] = uvxright;
        uvs[t++] = 0;

        positions[j++] = left[0];
        positions[j++] = left[1];
        positions[j++] = left[2] + height;
        uvs[t++] = uvxleft;
        uvs[t++] = vUvyMax;

        positions[j++] = left[0];
        positions[j++] = left[1];
        positions[j++] = left[2] + height;
        uvs[t++] = uvxleft;
        uvs[t++] = vUvyMax;

        positions[j++] = right[0];
        positions[j++] = right[1];
        positions[j++] = right[2] + 0;
        uvs[t++] = uvxright;
        uvs[t++] = 0;

        positions[j++] = right[0];
        positions[j++] = right[1];
        positions[j++] = right[2] + height;
        uvs[t++] = uvxright;
        uvs[t++] = vUvyMax;

        offset += distance;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    return geometry;
}

export function createFenceGeometry(lines: { geometry: LineString; __source: SourceInfo }[], getElevation) {
    const geometries = [];
    lines.forEach((line) => {
        const feature = line.__source.object;
        const elevation = getFeatureData(getElevation, feature);

        const geometry = createFenceGeometryFromLine(line.geometry, elevation);
        geometries.push(geometry);
    });

    const geometry = mergeGeometries(geometries);
    return geometry;
}

export function createFenceMaterial(options: FenceOptions, { name, vertexShader, fragmentShader }): ShaderMaterial {
    const color = new Color(options.color !== undefined ? options.color : 0xffff00);
    const opacity = options.opacity !== undefined ? options.opacity : 0.8;
    const num = options.num !== undefined ? options.num : 5;
    const speed = options.speed !== undefined ? options.speed : 1;

    const shader = {
        name: name,
        side: DoubleSide,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: AdditiveBlending,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,

        uniforms: {
            time: { value: 0 },
            color: { value: color },
            opacity: { value: opacity },
            num: { value: num },
            speed: { value: speed },
        },
    };

    const material = new ShaderMaterial(shader);
    return material;
}

export function createRippleShaderMaterial(options: FenceOptions): ShaderMaterial {
    const color = new Color(options.color !== undefined ? options.color : 0xffff00);
    const shader = {
        name: 'RippleShader',
        vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
        fragmentShader: `
        uniform float time;
        uniform float opacity;
        uniform vec3 color;
        uniform float num;
        uniform float speed;
        varying vec2 vUv;
        #define PI 3.14159265
        void main() {
            vec4 fragColor = vec4(0.);
            float sin = sin((vUv.y - time * speed / num) * PI * 2.0 * num);
            float high = 0.92;
            float medium = 0.4;
            if (sin > high) {
                fragColor = vec4(mix(vec3(.8, 1., 1.), color, (1. - sin) / (1. - high)), 1.);
            } else if(sin > medium) {
                fragColor = vec4(color, mix(1., 0., 1.-(sin - medium) / (high - medium)));
            } else {
                fragColor = vec4(color, 0.);
            }
            vec3 fade = mix(color, vec3(0., 0., 0.), vUv.y);
            fragColor = mix(fragColor, vec4(fade, 1.), 0.85);
            gl_FragColor = vec4(fragColor.rgb, fragColor.a * opacity * (1. - vUv.y));
        }
        `,
    };

    return createFenceMaterial(options, shader);
}

export function createWaveShaderMaterial(options: FenceOptions): ShaderMaterial {
    const shader = {
        name: 'WaveShader',
        vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
        fragmentShader: `
        uniform float time;
        uniform float opacity;
        uniform vec3 color;
        uniform float num;
        uniform float speed;
        varying vec2 vUv;
                
        void main() {                
            float amplitude = 1.;
            float x = vUv.x;
            float y = sin(x * num) ;
            float t = 0.01*(-time*130.0*speed);
            y += sin(x*num*2.1 + t)*4.5;
            y += sin(x*num*1.72 + t*1.121)*4.0;
            y += sin(x*num*2.221 + t*0.437)*5.0;
            y += sin(x*num*3.1122+ t*4.269)*2.5;
            y *= amplitude*0.06;
            y /= 3.;
            y += 0.55;
            float ap = step(vUv.y,y) * (y-vUv.y)/y;
            gl_FragColor = vec4(color,ap*opacity);
        }
        `,
    };

    return createFenceMaterial(options, shader);
}

export function createFadeShaderMaterial(options: FenceOptions): ShaderMaterial {
    const shader = {
        name: 'fadeShader',
        vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
        fragmentShader: `
        uniform float time;
        uniform float opacity;
        uniform vec3 color;
        uniform float num;
        uniform float speed;
        varying vec2 vUv;
        #define PI 3.14159265
                
        void main() {
            float timeDelta = (time * speed * 0.5 - floor(time * speed * 0.5));
            float alpha = 1.0 - vUv.y / (1.0 - timeDelta);   
            alpha = clamp( alpha, 0.0, 1.0); 
            gl_FragColor = vec4(color, alpha * opacity);
        }
        `,
    };

    return createFenceMaterial(options, shader);
}

export class FenceMesh extends Mesh {
    _startTime: number;
    constructor(geometry, options: FenceOptions = {}) {
        super(geometry);

        let material;

        if (options.material instanceof Material) {
            material = options.material;
        } else if (options.material === 'ripple') {
            material = createRippleShaderMaterial(options);
        } else if (options.material === 'wave') {
            material = createWaveShaderMaterial(options);
        } else if (options.material === 'fade') {
            material = createFadeShaderMaterial(options);
        } else {
            material = createFadeShaderMaterial(options);
        }

        this.material = material;
        this._startTime = 0;
    }

    updateSceneTime(time: number, delta: number, scene) {
        if (this._startTime === 0) this._startTime = time;
        const deltaTime = time - this._startTime;
        if (this.material instanceof ShaderMaterial) {
            (this.material as ShaderMaterial).uniforms['time'].value = deltaTime / 1000;
        }
    }
}

export function createFenceMesh(featureData: FeatureData, options: FenceOptions) {
    const { geometries } = featureData;
    const { getElevation, height } = options;

    const features = geometries.lineFeatures.length > 0 ? geometries.lineFeatures : geometries.polygonOutlineFeatures.length > 0 ? geometries.polygonOutlineFeatures : [];

    const geometry = createFenceGeometry(features, getElevation === undefined ? height : getElevation);
    const mesh = new FenceMesh(geometry, options);
    return mesh;
}
