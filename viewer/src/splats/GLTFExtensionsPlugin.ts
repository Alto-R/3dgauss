import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { TilesRenderer } from '3d-tiles-renderer';
import { GLTFLoaderPlugin, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface GLTFExtensionsPluginOptions {
    rtc?: boolean;
    plugins?: ((parser: GLTFParser) => GLTFLoaderPlugin)[];
    dracoLoader?: DRACOLoader | null;
    ktxLoader?: KTX2Loader | null;
    meshoptDecoder?: unknown;
    autoDispose?: boolean;
}

export class GLTFExtensionsPlugin {
    tiles: TilesRenderer | null = null;

    rtc: boolean;
    plugins: ((parser: GLTFParser) => GLTFLoaderPlugin)[];

    autoDispose: boolean;
    dracoLoader: DRACOLoader | null;
    ktxLoader: KTX2Loader | null;
    meshoptDecoder: unknown;

    private _gltfRegex = /\.(gltf|glb)$/g;
    private _dracoRegex = /\.drc$/g;
    private _loader: GLTFLoader | null = null;

    constructor(options: GLTFExtensionsPluginOptions = {}) {
        const opts = {
            rtc: true,
            plugins: [],
            dracoLoader: null,
            ktxLoader: null,
            meshoptDecoder: null,
            autoDispose: true,
            ...options,
        };

        this.rtc = opts.rtc;
        this.plugins = opts.plugins;

        this.autoDispose = opts.autoDispose;
        this.dracoLoader = opts.dracoLoader;
        this.ktxLoader = opts.ktxLoader;
        this.meshoptDecoder = opts.meshoptDecoder;
    }

    init(tiles: TilesRenderer) {
        const loader = new GLTFLoader(tiles.manager);

        if (this.dracoLoader) {
            loader.setDRACOLoader(this.dracoLoader);
            tiles.manager.addHandler(this._dracoRegex, this.dracoLoader);
        }

        if (this.ktxLoader) {
            loader.setKTX2Loader(this.ktxLoader);
        }

        if (this.meshoptDecoder) {
            loader.setMeshoptDecoder(this.meshoptDecoder as any);
        }

        this.plugins.forEach((plugin) => loader.register(plugin));

        tiles.manager.addHandler(this._gltfRegex, loader);
        this.tiles = tiles;
        this._loader = loader;
    }

    dispose() {
        if (this.tiles) {
            this.tiles.manager.removeHandler(this._gltfRegex);
            this.tiles.manager.removeHandler(this._dracoRegex);
        }
        if (this.autoDispose) {
            this.ktxLoader?.dispose();
            this.dracoLoader?.dispose();
        }
    }
}
