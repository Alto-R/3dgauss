import type { GeoJSON } from 'geojson';

export type GeometryGeoJsonFile = string;
export type GeometryGeoJson = GeoJSON;

export type GeometryDataType = GeometryGeoJsonFile | GeometryGeoJson;
