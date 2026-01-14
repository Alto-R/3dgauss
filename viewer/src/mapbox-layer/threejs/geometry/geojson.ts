// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import { load } from '@loaders.gl/core';
// import { log } from '@deck.gl/core';
import type { Feature, GeoJSON, GeoJsonGeometryTypes, Geometry, LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon, Position } from 'geojson';
// import { coordEach } from '@turf/meta';
// import { AllGeoJSON } from '@turf/helpers';

import type { Matrix4 } from 'three';
import ThreejsUtils from '../threejs-utils';
import { LngLatLike } from 'mapbox-gl';

type SupportedGeometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon;

export type SourceInfo = {
    object: Feature;
    index: number;
};

export type SeparatedGeometries = {
    pointFeatures: { geometry: Point; __source: SourceInfo }[];
    lineFeatures: { geometry: LineString; __source: SourceInfo }[];
    polygonFeatures: { geometry: Polygon; __source: SourceInfo }[];
    polygonOutlineFeatures: { geometry: LineString; __source: SourceInfo }[];
};

export type FeatureData = {
    features: Feature[];
    centroid: Position;
    geometries: SeparatedGeometries;
};

/**
 * "Normalizes" complete or partial GeoJSON data into iterable list of features
 * Can accept GeoJSON geometry or "Feature", "FeatureCollection" in addition
 * to plain arrays and iterables.
 * Works by extracting the feature array or wrapping single objects in an array,
 * so that subsequent code can simply iterate over features.
 *
 * @param {object} geojson - geojson data
 * @param {Object|Array} data - geojson object (FeatureCollection, Feature or
 *  Geometry) or array of features
 * @return {Array|"iteratable"} - iterable list of features
 */
export function getGeojsonFeatures(geojson: GeoJSON): Feature[] {
    // If array, assume this is a list of features
    if (Array.isArray(geojson)) {
        return geojson;
    }

    // log.assert(geojson.type, 'GeoJSON does not have type');

    switch (geojson.type) {
        case 'Feature':
            // Wrap the feature in a 'Features' array
            return [geojson];
        case 'FeatureCollection':
            // Just return the 'Features' array from the collection
            // log.assert(Array.isArray(geojson.features), 'GeoJSON does not have features array');
            return geojson.features;
        default:
            // Assume it's a geometry, we'll check type in separateGeojsonFeatures
            // Wrap the geometry object in a 'Feature' object and wrap in an array
            return [{ geometry: geojson }] as Feature[];
    }
}

// Linearize
export function separateGeojsonFeatures(features: Feature[], wrapFeature: <T>(row: T, sourceObject: any, sourceObjectIndex: number) => { geometry; __source: SourceInfo }, dataRange: { startRow?: number; endRow?: number } = {}): SeparatedGeometries {
    const separated: SeparatedGeometries = {
        pointFeatures: [],
        lineFeatures: [],
        polygonFeatures: [],
        polygonOutlineFeatures: [],
    };
    const { startRow = 0, endRow = features.length } = dataRange;

    for (let featureIndex = startRow; featureIndex < endRow; featureIndex++) {
        const feature = features[featureIndex];
        const { geometry } = feature;

        if (!geometry) {
            // geometry can be null per specification
            continue; // eslint-disable-line no-continue
        }

        if (geometry.type === 'GeometryCollection') {
            // log.assert(Array.isArray(geometry.geometries), 'GeoJSON does not have geometries array');
            const { geometries } = geometry;
            for (let i = 0; i < geometries.length; i++) {
                const subGeometry = geometries[i];
                separateGeometry(subGeometry as SupportedGeometry, separated, wrapFeature, feature, featureIndex);
            }
        } else {
            separateGeometry(geometry, separated, wrapFeature, feature, featureIndex);
        }
    }

    return separated;
}

function closePolygonPath(path) {
    if (path.length > 2) {
        const first = path[0];
        const last = path[path.length - 1];
        if (last[0] !== first[0] || last[1] !== first[1]) {
            path.push(first);
        }
    }
}

function separateGeometry(geometry: SupportedGeometry, separated: SeparatedGeometries, wrapFeature: <T>(row: T, sourceObject: any, sourceObjectIndex: number) => { geometry; __source: SourceInfo }, sourceFeature: Feature, sourceFeatureIndex: number) {
    const { type, coordinates } = geometry;
    const { pointFeatures, lineFeatures, polygonFeatures, polygonOutlineFeatures } = separated;

    if (!validateGeometry(type, coordinates)) {
        // Avoid hard failure if some features are malformed
        // log.warn(`${type} coordinates are malformed`)();
        return;
    }

    // Split each feature, but keep track of the source feature and index (for Multi* geometries)
    switch (type) {
        case 'Point':
            pointFeatures.push(
                wrapFeature(
                    {
                        geometry,
                    },
                    sourceFeature,
                    sourceFeatureIndex,
                ),
            );
            break;
        case 'MultiPoint':
            coordinates.forEach((point) => {
                pointFeatures.push(
                    wrapFeature(
                        {
                            geometry: { type: 'Point', coordinates: point },
                        },
                        sourceFeature,
                        sourceFeatureIndex,
                    ),
                );
            });
            break;
        case 'LineString':
            lineFeatures.push(
                wrapFeature(
                    {
                        geometry,
                    },
                    sourceFeature,
                    sourceFeatureIndex,
                ),
            );
            break;
        case 'MultiLineString':
            // Break multilinestrings into multiple lines
            coordinates.forEach((path) => {
                lineFeatures.push(
                    wrapFeature(
                        {
                            geometry: { type: 'LineString', coordinates: path },
                        },
                        sourceFeature,
                        sourceFeatureIndex,
                    ),
                );
            });
            break;
        case 'Polygon':
            polygonFeatures.push(
                wrapFeature(
                    {
                        geometry,
                    },
                    sourceFeature,
                    sourceFeatureIndex,
                ),
            );
            // Break polygon into multiple lines
            coordinates.forEach((path) => {
                closePolygonPath(path);
                polygonOutlineFeatures.push(
                    wrapFeature(
                        {
                            geometry: { type: 'LineString', coordinates: path },
                        },
                        sourceFeature,
                        sourceFeatureIndex,
                    ),
                );
            });
            break;
        case 'MultiPolygon':
            // Break multipolygons into multiple polygons
            coordinates.forEach((polygon) => {
                polygonFeatures.push(
                    wrapFeature(
                        {
                            geometry: { type: 'Polygon', coordinates: polygon },
                        },
                        sourceFeature,
                        sourceFeatureIndex,
                    ),
                );
                // Break polygon into multiple lines
                polygon.forEach((path) => {
                    closePolygonPath(path);
                    polygonOutlineFeatures.push(
                        wrapFeature(
                            {
                                geometry: {
                                    type: 'LineString',
                                    coordinates: path,
                                },
                            },
                            sourceFeature,
                            sourceFeatureIndex,
                        ),
                    );
                });
            });
            break;
        default:
    }
}

/**
 * Simple GeoJSON validation util. For perf reasons we do not validate against the full spec,
 * only the following:
   - geometry.type is supported
   - geometry.coordinate has correct nesting level
 */
const COORDINATE_NEST_LEVEL: Record<SupportedGeometry['type'], number> = {
    Point: 1,
    MultiPoint: 2,
    LineString: 2,
    MultiLineString: 3,
    Polygon: 3,
    MultiPolygon: 4,
};

export function validateGeometry(type: GeoJsonGeometryTypes, coordinates: any): boolean {
    let nestLevel = COORDINATE_NEST_LEVEL[type] as number;

    // log.assert(nestLevel, `Unknown GeoJSON type ${type}`);

    while (coordinates && --nestLevel > 0) {
        coordinates = coordinates[0];
    }

    return coordinates && Number.isFinite(coordinates[0]);
}


// 手动实现 coordEach 函数
export function coordEach(geojson, callback) {
    const geomType = geojson.type;

    if (geomType === 'Point') {
        callback(geojson.coordinates);
    } else if (geomType === 'MultiPoint' || geomType === 'LineString') {
        for (let i = 0; i < geojson.coordinates.length; i++) {
            callback(geojson.coordinates[i]);
        }
    } else if (geomType === 'MultiLineString' || geomType === 'Polygon') {
        for (let i = 0; i < geojson.coordinates.length; i++) {
            for (let j = 0; j < geojson.coordinates[i].length; j++) {
                callback(geojson.coordinates[i][j]);
            }
        }
    } else if (geomType === 'MultiPolygon') {
        for (let i = 0; i < geojson.coordinates.length; i++) {
            for (let j = 0; j < geojson.coordinates[i].length; j++) {
                for (let k = 0; k < geojson.coordinates[i][j].length; k++) {
                    callback(geojson.coordinates[i][j][k]);
                }
            }
        }
    } else if (geomType === 'GeometryCollection') {
        for (let i = 0; i < geojson.geometries.length; i++) {
            coordEach(geojson.geometries[i], callback);
        }
    } else if (geomType === 'Feature') {
        coordEach(geojson.geometry, callback);
    } else if (geomType === 'FeatureCollection') {
        for (let i = 0; i < geojson.features.length; i++) {
            coordEach(geojson.features[i].geometry, callback);
        }
    }
}


export function getCentroid(geojson): Position {
    let xSum = 0;
    let ySum = 0;
    let zSum = 0;
    let len = 0;
    coordEach(geojson, function (coord) {
        xSum += coord[0];
        ySum += coord[1];
        zSum += coord.length > 2 ? coord[2] : 0;
        len++;
    });
    return [xSum / len, ySum / len, zSum / len];
}

export function getBoundingBox(geojson): [Position, Position] {
    var minx, miny, minz, maxx, maxy, maxz;
    (minx = miny = minz = Infinity), (maxx = maxy = maxz = -Infinity);
    coordEach(geojson, function (p) {
        const z = p.length > 2 ? p[2] : 0;
        if (p[0] < minx) minx = p[0];
        if (p[1] < miny) miny = p[1];
        if (z < minz) minz = z;
        if (p[0] > maxx) maxx = p[0];
        if (p[1] > maxy) maxy = p[1];
        if (z > maxz) maxz = z;
    });
    return [
        [minx, miny, minz],
        [maxx, maxy, maxz],
    ];
}

export async function loadGeojson(dataFile: string | GeoJSON | Geometry[]): Promise<FeatureData> {
    let data: GeoJSON;
    if (typeof dataFile == 'string') {
        const url = dataFile;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        data = await response.json();
        // await load(url, []).then((file) => {
        //     data = file;
        // });
    } else {
        if (Array.isArray(dataFile)) {
            data = {
                type: 'GeometryCollection',
                geometries: structuredClone(dataFile),
            };
        } else {
            data = structuredClone(dataFile);
        }
    }

    const wrapFeature = (row: any, sourceObject: any, sourceObjectIndex: number) => {
        // @ts-ignore (TS2339) adding undefined property
        row.__source = {
            object: sourceObject,
            index: sourceObjectIndex,
        };
        return row;
    };

    const features: Feature[] = getGeojsonFeatures(data) as any;
    const geometries: SeparatedGeometries = separateGeojsonFeatures(features, wrapFeature);
    const centroid = getCentroid(data);

    return {
        features,
        centroid,
        geometries,
    };
}

function project(coordinates: Position, dataMatrixInv: Matrix4): Position {
    const [x, y, z] = coordinates;
    const [px, py, pz] = ThreejsUtils.toScenePosition(dataMatrixInv, [x, y], z ? z : 0).toArray();
    return [px, py, pz];
}

export function projectFeatureData(featrueData: FeatureData, dataCenter: LngLatLike): FeatureData {
    const dataMatrix = ThreejsUtils.updateWorldMatrix(null, dataCenter);
    const dataMatrixInv = dataMatrix.clone().invert();

    const { features, centroid, geometries } = featrueData;
    const { pointFeatures, lineFeatures, polygonFeatures, polygonOutlineFeatures } = geometries;

    pointFeatures.forEach((feature) => {
        const { geometry } = feature;
        geometry.coordinates = project(geometry.coordinates, dataMatrixInv);
    });
    lineFeatures.forEach((feature) => {
        const { geometry } = feature;
        const { coordinates } = geometry;
        const positions = coordinates.map((coord) => {
            return project(coord, dataMatrixInv);
        });
        geometry.coordinates = positions;
    });

    polygonFeatures.forEach((feature) => {
        const { geometry } = feature;
        const { coordinates } = geometry;
        const positions = coordinates.map((path) => {
            const positions = path.map((coord) => {
                return project(coord, dataMatrixInv);
            });
            return positions;
        });
        geometry.coordinates = positions;
    });

    polygonOutlineFeatures.forEach((feature) => {
        const { geometry } = feature;
        const { coordinates } = geometry;
        const positions = coordinates.map((coord) => {
            return project(coord, dataMatrixInv);
        });
        geometry.coordinates = positions;
    });

    return {
        features,
        centroid,
        geometries,
    };
}

export function getFeatureData(func, feature) {
    if (typeof func === 'function') {
        if (feature) return func(feature);
    }
    return func;
}
