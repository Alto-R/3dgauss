import { CatmullRomCurve3, Material, Mesh, MeshBasicMaterial, MeshBasicMaterialParameters, TubeGeometry, Vector3 } from 'three';

import type { Feature, LineString } from 'geojson';
import { getFeatureData, type FeatureData, type SourceInfo } from '../geometry/geojson';
import { mergeGeometries } from '../geometry/BufferGeometryUtils';

export type TubeOptions = {
    material?: MeshBasicMaterialParameters | undefined;

    speed?: number | undefined;
    tubeRadius?: number | undefined;
    tubularSegments?: number | undefined;
    radialSegments?: number | undefined;
    getTubeRadius?: (feature: Feature) => number | number | undefined;
};

export function createTubeGeometryFromLine(line: LineString, tubularSegments?: number, radius?: number, radialSegments?: number): TubeGeometry {
    const ring = line.coordinates;

    const points = [];
    ring.forEach((coord) => {
        const point = new Vector3(coord[0], coord[1], coord.length > 2 ? coord[2] : 0);
        points.push(point);
    });
    const curve = new CatmullRomCurve3(points);
    const geometry = new TubeGeometry(curve, tubularSegments, radius, radialSegments);
    return geometry;
}

export function createTubeGeometry(lines: { geometry: LineString; __source: SourceInfo }[], options: TubeOptions) {
    const { tubeRadius, tubularSegments, radialSegments, getTubeRadius } = options;
    const geometries = [];
    lines.forEach((line) => {
        const feature = line.__source.object;
        const radius = getFeatureData(getTubeRadius, feature) | tubeRadius;

        const geometry = createTubeGeometryFromLine(line.geometry, tubularSegments, radius, radialSegments);
        geometries.push(geometry);
    });

    const geometry = mergeGeometries(geometries);
    return geometry;
}

export class TubeMesh extends Mesh {
    _startTime: number;
    speed: number | undefined;
    constructor(geometry, material: any = {}) {
        super(geometry);
        this.material = material instanceof Material ? material : new MeshBasicMaterial(material);
        this._startTime = 0;
    }

    updateSceneTime(time: number, delta: number, scene) {
        if (this.material instanceof MeshBasicMaterial && this.material.map && this.speed) {
            if (this._startTime === 0) this._startTime = time;
            const deltaTime = time - this._startTime;
            this.material.map.offset.x = (deltaTime / 1000) * this.speed;
        }
    }
}

export function createTubeMesh(featureData: FeatureData, options: TubeOptions) {
    const { geometries } = featureData;
    const { material, speed } = options;

    const features = geometries.lineFeatures.length > 0 ? geometries.lineFeatures : geometries.polygonOutlineFeatures.length > 0 ? geometries.polygonOutlineFeatures : [];

    const geometry = createTubeGeometry(features, options);

    const mesh = new TubeMesh(geometry, material);
    mesh.speed = speed;
    return mesh;
}
