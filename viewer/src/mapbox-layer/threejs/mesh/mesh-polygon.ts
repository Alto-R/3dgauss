import { ColorRepresentation, Mesh, MeshBasicMaterial, Vector3 } from 'three';

import type { Polygon } from 'geojson';
import type { FeatureData } from '../geometry/geojson';
import { mergeGeometries } from '../geometry/BufferGeometryUtils';
import { Shape3 } from '../geometry/Shape3';
import { Path3 } from '../geometry/Path3';
import { Shape3Geometry } from '../geometry/Shape3Geometry';
import { Extrude3Geometry } from '../geometry/Extrude3Geometry';

export type PolygonOptions = {
    color?: ColorRepresentation | undefined;
    opacity?: number | undefined;
};

export function createShapeFromPolygon(polygon: Polygon, baseHeight: number | undefined = 0): Shape3 {
    const shape = new Shape3();
    const exteriorRing = polygon.coordinates[0];

    const points = [];
    exteriorRing.forEach((coord) => {
        points.push(new Vector3(coord[0], coord[1], (coord[2] ?? 0) + (baseHeight ?? 0)));
    });
    shape.setFromPoints(points);

    for (let i = 1; i < polygon.coordinates.length; i++) {
        const interiorRing = polygon.coordinates[i];

        const path = new Path3();

        const points = [];
        interiorRing.forEach((coord) => {
            points.push(new Vector3(coord[0], coord[1], (coord[2] ?? 0) + (baseHeight ?? 0)));
        });
        path.setFromPoints(points);
        shape.holes.push(path);
    }
    return shape;
}

export function createExtrudeGeometry(polygon: Polygon, height: number, baseHeight: number | undefined = 0){
    const shape = createShapeFromPolygon(polygon, baseHeight);
    const geometry = new Extrude3Geometry(shape, {
        depth: height,
        bevelEnabled: false,
    });
    return geometry;
}

export function createPolygonGeometry(polygon: Polygon) {

    const shape = createShapeFromPolygon(polygon);
    const geometry = new Shape3Geometry(shape);
    return geometry;

}

export function createPolygonsGeometry(polygons: { geometry: Polygon }[]) {
    const geometries = [];
    polygons.forEach((polygon) => {
        const geometry = createPolygonGeometry(polygon.geometry);
        geometries.push(geometry);
    });

    const geometry = mergeGeometries(geometries);
    return geometry;
}

export function createPolygonMesh(featureData: FeatureData, options: PolygonOptions) {
    const { geometries } = featureData;
    const geometry = createPolygonsGeometry(geometries.polygonFeatures);
    const material = new MeshBasicMaterial({
        color: options.color,
        opacity: options.opacity,
        transparent: options.opacity && options.opacity < 1,
    });
    const mesh = new Mesh(geometry, material);
    return mesh;
}
