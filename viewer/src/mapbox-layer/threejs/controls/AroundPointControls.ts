import { ThreejsSceneLayer } from '../threejs-scene';
import { Position } from '../threejs-types';
import { extend } from '../utils/Util';
import { BaseControls } from './BaseControls';
import { CatmullRomCurve3, MathUtils, Vector3 } from 'three';
import { FollowCamera } from './FollowCamera';
import { CameraOptions } from 'mapbox-gl';
import { updateMapCameraPosition } from './ControlUtils';

export type AroundPointControlsOptions = {
    position?: Position;
    point?: Vector3;
    duration?: number;
    isClockwise?: boolean;

    cameraBearing?: number;
    cameraPitch?: number;
    cameraDistance?: number;
};

const defaultOptions: AroundPointControlsOptions = {
    position: undefined,
    point: undefined,
    duration: 10,
    isClockwise: true,

    cameraBearing: 0,
    cameraPitch: 45,
    cameraDistance: 10,
};

export class AroundPointControls extends BaseControls {
    options: AroundPointControlsOptions;
    followCamera: FollowCamera;
    mapCameraPosition: CameraOptions = {};

    private _time: number;

    constructor(scene: ThreejsSceneLayer, options: AroundPointControlsOptions) {
        super(scene);

        this.options = extend({}, defaultOptions, options);

        this.followCamera = new FollowCamera();
        this.updatePosition();
    }

    updatePosition() {
        if (this.options.position) {
            this.options.point = this.scene.toScenePosition(this.options.position);
        }

        if (this.options.point) {
            this._time = 0;
        }
    }
    
    override update(time: number) {
        if (!this.enabled) {
            return;
        }

        this.UpdateMapCameraPosition(time);

        const map = this.scene.getMap();
        map.jumpTo(this.mapCameraPosition);
    }

    public UpdateMapCameraPosition(time: number = 0.0) {
        if (this.options.point === undefined) {
            return;
        }

        this._time += time;
        let t = (this._time % this.options.duration) / this.options.duration;
        if (this.options.isClockwise) t = 1 - t;

        this.followCamera.cameraPitch = this.options.cameraPitch;
        this.followCamera.cameraDistance = this.options.cameraDistance;

        this.followCamera.cameraBearing = this.options.cameraBearing + t * 360.0;
        this.followCamera.objectPosition.copy(this.options.point);

        this.followCamera.update(time);

        this.mapCameraPosition = updateMapCameraPosition(this.scene, this.followCamera);

        return this.mapCameraPosition;
    }
}
