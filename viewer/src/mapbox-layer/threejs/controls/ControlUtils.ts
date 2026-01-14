import { Vector3 } from 'three';
import { FollowCamera } from './FollowCamera';
import { ThreejsSceneLayer } from '../threejs-scene';
import { CameraOptions } from 'mapbox-gl';

export function updateMapCameraPosition(scene: ThreejsSceneLayer, followCamera: FollowCamera) : CameraOptions {
    const map = scene.getMap();

    const targetPosition = followCamera.getTargetPosition();
    const cameraPosition = followCamera.getCameraPosition();
    const cameraBearing = followCamera.cameraBearing;
    const cameraPitch = followCamera.cameraPitch;

    const cameraToTargetDistance = new Vector3().subVectors(cameraPosition, targetPosition).length();
    const targetMapPosition = scene.toMapPosition(targetPosition);
    // const targetMercatorCoordinate = this.scene.toMercatorCoordinate(new Vector3(targetPosition.x, targetPosition.y, cameraToTargetDistance));

    // const cameraMercatorZ = targetMercatorCoordinate.z;
    const cameraMercatorZ = (map.transform.pixelsPerMeter / map.transform.worldSize) * cameraToTargetDistance;
    const zoom = map.transform._zoomFromMercatorZ(cameraMercatorZ);

    const mapCameraPosition = {
        // @ts-ignore
        center: targetMapPosition as LngLatLike,
        bearing: cameraBearing,
        pitch: cameraPitch,
        zoom: zoom,
    };

    return mapCameraPosition;
}
