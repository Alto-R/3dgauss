import { BufferGeometry, Camera, ColorRepresentation, Group, Material, Mesh, Scene, Vector2, Vector3, Vector4, WebGLRenderer } from 'three';

import type { Feature, LineString } from 'geojson';
import { getFeatureData, type FeatureData, type SourceInfo } from '../geometry/geojson';
import { MeshLine, MeshLineMaterial } from './MeshLine';
import { mergeGeometries } from '../geometry/BufferGeometryUtils';

export type LineOptions = {
    lineWidth?: number | undefined;
    map?: { value: null };
    useMap?: number | undefined;
    alphaMap?: { value: null };
    useAlphaMap?: number | undefined;
    color?: ColorRepresentation | undefined;
    opacity?: number | undefined;
    resolution?: Vector2 | undefined;
    sizeAttenuation?: number | undefined;
    dashArray?: number | undefined;
    dashOffset?: number | undefined;
    dashRatio?: number | undefined;
    useDash?: number | undefined;
    visibility?: number | undefined;
    alphaTest?: number | undefined;
    repeat?: Vector2 | undefined;
    offset?: Vector2 | undefined;

    getLineWidth?: (feature: Feature) => number | number | undefined;
};

export function createLineGeometryFromLine(line: LineString, lineWidth: number | undefined): MeshLine {
    const geometry = new MeshLine();

    const ring = line.coordinates;

    const points = [];
    ring.forEach((coord) => {
        const point = new Vector3(coord[0], coord[1], coord.length > 2 ? coord[2] : 0);
        points.push(point.x, point.y, point.z);
    });
    geometry.setPoints(points, lineWidth ? (p) => lineWidth : undefined);
    return geometry;
}

export function createLineGeometry(lines: { geometry: LineString; __source: SourceInfo }[], getLineWidth) {
    const geometries = [];
    lines.forEach((line) => {
        const feature = line.__source.object;
        const lineWidth = getFeatureData(getLineWidth, feature);

        const geometry = createLineGeometryFromLine(line.geometry, lineWidth);
        geometries.push(geometry);
    });

    const geometry = mergeGeometries(geometries);
    return geometry;
}

export class LineMesh extends Mesh {
    _startTime: number;
    constructor(geometry, options: LineOptions = {}) {
        super(geometry);
        let material = new MeshLineMaterial(options);
        this.material = material;
        this._startTime = 0;
    }

    updateSceneTime(time: number, delta: number, scene) {
        if (this._startTime === 0) this._startTime = time;
        const deltaTime = time - this._startTime;
        if (this.material instanceof MeshLineMaterial) {
            (this.material as MeshLineMaterial).uniforms['time'].value = deltaTime / 1000;
        }
    }

    override onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group): void {
        if (this.material instanceof MeshLineMaterial) {
            const uniforms = this.material.uniforms;
            if (uniforms) {
                if (uniforms.resolution) {
                    const viewport = new Vector4();
                    renderer.getViewport(viewport);
                    const width = viewport.z;
                    const height = viewport.w;
                    uniforms.resolution.value.set(width, height);
                }
            }
        }
    }
}

export function createLineMesh(featureData: FeatureData, options: LineOptions) {
    const { geometries } = featureData;

    const { getLineWidth, ...matOptions } = options;

    const features = geometries.lineFeatures.length > 0 ? geometries.lineFeatures : geometries.polygonOutlineFeatures.length > 0 ? geometries.polygonOutlineFeatures : [];

    const geometry = createLineGeometry(features, getLineWidth);

    const mesh = new LineMesh(geometry, matOptions);
    return mesh;
}
