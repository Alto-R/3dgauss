import { Object3D, Vector3, Camera, WebGLRenderer } from 'three';
import { TilesRenderer } from '3d-tiles-renderer';

export class GaussianSplattingTilesetPlugin {
    tiles: TilesRenderer | null;
    camera: Camera;
    _onUpdateBefore: () => void;
    _onUpdateAfter: () => void;

    constructor(renderer: WebGLRenderer, camera: Camera, maxGaussianSplatingCount?: number) {
        this.tiles = null;
        this.camera = camera;

        this._onUpdateBefore = () => {
            this.onUpdateBefore();
        };
        this._onUpdateAfter = () => {
            this.onUpdateAfter();
        };
    }

    init(tiles: TilesRenderer) {
        this.tiles = tiles;
        tiles.addEventListener('update-before', this._onUpdateBefore);
        tiles.addEventListener('update-after', this._onUpdateAfter);
    }

    dispose() {
        const tiles = this.tiles;
        if (tiles) {
            tiles.removeEventListener('update-before', this._onUpdateBefore);
            tiles.removeEventListener('update-after', this._onUpdateAfter);
        }
    }

    onUpdateBefore() {}

    onUpdateAfter() {
        const tiles = this.tiles;
        const camera = this.camera;

        if (!tiles || !camera) {
            return;
        }

        tiles.forEachLoadedModel((scene: Object3D) => {
            if (scene) {
                scene.traverse((child) => {
                    // @ts-ignore
                    if (child.isGaussianSplattingMesh) {
                        const center = new Vector3();
                        // @ts-ignore
                        child.boundingBox.getCenter(center);
                        center.z = 0;
                        const cameraMatrix = camera.matrixWorldInverse;
                        center.applyMatrix4(child.matrixWorld);
                        center.applyMatrix4(cameraMatrix);
                        child.renderOrder = -center.length();
                    }
                });
            }
        });
    }
}
