import { DoubleSide, Vector3, ShaderMaterial, Mesh, CanvasTexture } from 'three';
import { getBoundingBox } from '../geometry/geojson';

import { SceneObject } from '../object/scene-object';
import { ThreejsSceneLayer } from '../threejs-scene';
import { Position } from '../threejs-types';

import h337 from '../geometry/heatmap';
import { getHeatmapGeometrySize, HeatmapGeometry } from '../geometry/HeatmapGeometry';

export type HeatmapOptions = {
    id: string; //必填加载图层的 id，定义图层的唯一标识符。
    data: Position[]; //必填定义3D热力图图层的输入数据，例 data = [[lon,lat,value]]，参数分别为经度，纬度，属性值。
    coordinates?: Position[]; //可选定义3D热力图图层的数据边界范围， data 必须在该边界内，例 coordinates = [[lon,lat,alt]]，参数分别为经度，纬度，高度。此项激活可用于实时更新范围内的热力图。

    width?: number; //可选定义3D热力图图层画布的宽度。
    height?: number; //可选定义3D热力图图层画布高度。
    radius?: number; //可选每个数据点的半径。
    blur?: number; //可选范围为 [0,1]，应用于所有点数据。系数越高，渐变越平滑。
    gradient?: any; //可选表示渐变的色带对象,不设置则使用默认样式，默认样式见下方案例。

    widthSegments?: number; //可选宽度片段数，值越大热力图越精细。
    heightSegments?: number; //可选长度片段数，值越大热力图越精细。

    heightRatio?: number; //可选定义3D热力图拉伸高度。

    depthTest?: boolean; //可选是否启用深度测试。
    opacity?: number; //可选热力图的透明度，范围:0-1。
};

export class HeatmapObject extends SceneObject {
    _options: HeatmapOptions;

    _meshObject: Mesh | undefined;
    _heatmap: any | undefined;
    _heatmapCanvas: HTMLElement | undefined;

    _boundVertices: Vector3[];
    _dataVertices: Vector3[];

    constructor(options: HeatmapOptions) {
        super();
        this._options = options;

        this._meshObject = undefined;
        this._heatmap = undefined;
        this._heatmapCanvas = undefined;
    }

    override updateSceneTransform() {
        let { coordinates, data } = this._options;
        if (coordinates == undefined || coordinates.length != 4) {
            // 从this._options.data 中计算边界
            const [[minx, miny, minz], [maxx, maxy, maxz]] = getBoundingBox({
                type: 'MultiPoint',
                coordinates: data,
            });
            coordinates = [
                [minx, maxy, minz],
                [minx, miny, minz],
                [maxx, miny, minz],
                [maxx, maxy, minz],
            ];
        }

        // var centroid = getCentroid({ coordinates: coordinates });
        // const cP = this._scene.toScenePosition(centroid);

        this._boundVertices = [];
        coordinates.forEach((p) => {
            const v = this._scene.toScenePosition(p);
            this._boundVertices.push(v);
        });

        this._dataVertices = [];
        data.forEach((p) => {
            const v = this._scene.toScenePosition([p[0], p[1]]);
            this._dataVertices.push(new Vector3(v.x, v.y, p[2]));
        });

        this.buildHeatmap();

        this.updateMatrixWorld(true);
    }

    buildHeatmap() {
        const geomSize = getHeatmapGeometrySize(this._boundVertices[0], this._boundVertices[1], this._boundVertices[2], this._boundVertices[3]);

        const width = this._options.width || geomSize[0];
        const height = this._options.height || (width ? (width / geomSize[0]) * geomSize[1] : geomSize[1]);
        const blur = this._options.blur || 0.8;
        const radius = this._options.radius || 10;
        const gradient = this._options.gradient || {};

        const heatmapCanvas = document.createElement('heatmap-canvas');
        heatmapCanvas.style.width = width.toString();
        heatmapCanvas.style.height = height.toString();
        heatmapCanvas.style.position = 'absolute';
        heatmapCanvas.style.top = '0';
        heatmapCanvas.style.left = '0';
        //   document.body.appendChild(heatmapCanvas);
        //   heatmapCanvas.style.display = "none";

        this._heatmapCanvas = heatmapCanvas;
        this._heatmap = h337.create({
            container: heatmapCanvas,
            width,
            height,
            blur,
            radius,
            gradient,
        });

        const widthSegments = this._options.widthSegments || 128;
        const heightSegments = this._options.heightSegments || (widthSegments ? (widthSegments / geomSize[0]) * geomSize[1] : 128);
        const heatmapGeometry = new HeatmapGeometry(this._boundVertices[0], this._boundVertices[1], this._boundVertices[2], this._boundVertices[3], widthSegments, heightSegments);

        let heatmapData = [];
        let minData = Infinity;
        let maxData = -Infinity;
        this._dataVertices.forEach((p) => {
            const uv = heatmapGeometry.getUV(p);
            const x = Math.round(width * uv.x);
            const y = Math.round(height * uv.y);
            const value = p.z;
            heatmapData.push({ x, y, value });
            if (value > maxData) maxData = value;
            if (value < minData) minData = value;
        });

        this._heatmap.setData({
            data: heatmapData,
            max: maxData * 0.9,
            min: minData,
        });

        const heightRatio = this._options.heightRatio || 1.0;
        const depthTest = this._options.depthTest || false;

        const texture = new CanvasTexture(this._heatmap._renderer.canvas);
        texture.needsUpdate = true;

        const shader = {
            transparent: true,
            //   blending: AdditiveBlending,
            depthTest: depthTest,
            side: DoubleSide,
            vertexShader: `
        uniform sampler2D heightMap;
        uniform float heightRatio;
        varying vec2 vUv;
        varying float hValue;
        varying vec3 cl;
        void main() {
            vUv = uv;
            vec3 pos = position;
            vec4 c = texture2D(heightMap, vUv);
            cl = c.rgb;
            hValue = c.a;
            pos.z += hValue * heightRatio;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
        }
      `,
            fragmentShader: `
        varying float hValue;
        varying vec3 cl;
        void main() {
            float v = abs(hValue - 1.);
            gl_FragColor = vec4(cl, .8 - v * v*1.1) ; 
        }
      `,
            uniforms: {
                heightMap: { value: texture },
                heightRatio: { value: heightRatio },
            },
        };

        const material = new ShaderMaterial(shader);

        material.uniforms.heightMap.value = texture;

        this._meshObject = new Mesh(heatmapGeometry, material);
        this.add(this._meshObject);
    }

    override updateSceneTime(time: number, delta: number) {
        if (this._meshObject) {
            // @ts-expect-error
            if (this._meshObject.updateSceneTime) {
                // @ts-expect-error
                this._meshObject.updateSceneTime(time, delta, this._scene);
            }
        }
    }

    override addToScene(scene: ThreejsSceneLayer): this {
        this._scene = scene;

        return super.addToScene(scene);
    }

    override removeFromScene(): this {
        if (this._meshObject) {
            this.remove(this._meshObject);
            this._meshObject = undefined;
        }

        if (this._heatmap) {
            this._heatmap = undefined;
        }

        if (this._heatmapCanvas) {
            this._heatmapCanvas.remove();
            this._heatmapCanvas = undefined;
        }
        return super.removeFromScene();
    }
}
