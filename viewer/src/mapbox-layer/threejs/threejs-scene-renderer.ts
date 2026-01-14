import { type Map as MapboxMap } from 'mapbox-gl';

import { WebGLRenderer } from 'three';

import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export default class ThreejsSceneRenderer {
    private _map: MapboxMap;
    private _renderer: WebGLRenderer;
    private _labelRenderer: CSS2DRenderer;

    constructor(map: MapboxMap, gl: WebGL2RenderingContext) {
        this._map = map;

        // Only create one threejs instance per context
        if (this._renderer && this._labelRenderer) {
            return;
        }

        let renderer: WebGLRenderer = new WebGLRenderer({
            alpha: true,
            antialias: true,
            canvas: map.getCanvas(),
            context: gl,
        });

        renderer.shadowMap.enabled = true;
        renderer.autoClear = false;

        let labelRenderer: CSS2DRenderer = new CSS2DRenderer();
        labelRenderer.setSize(map._containerWidth, map._containerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        labelRenderer.domElement.style.pointerEvents = 'none';
        map._container.appendChild(labelRenderer.domElement);
        map.on('resize', () => {
            labelRenderer.setSize(map._containerWidth, map._containerHeight);
        });

        this._renderer = renderer;
        this._labelRenderer = labelRenderer;
    }

    getRenderer() {
        return this._renderer;
    }

    render(scene, camera) {
        this._renderer.resetState();

        // render scene
        this._renderer.render(scene, camera);

        // render label
        this._labelRenderer.render(scene, camera);
    }
}
