import { Path3 } from './Path3.js';
import { generateUUID } from '../utils/MathUtils.js';

class Shape3 extends Path3 {
    constructor(points) {
        super(points);

        this.uuid = generateUUID();

        this.type = 'Shape3';

        this.holes = [];
    }

    getPointsHoles(divisions) {
        const holesPts = [];

        for (let i = 0, l = this.holes.length; i < l; i++) {
            holesPts[i] = this.holes[i].getPoints(divisions);
        }

        return holesPts;
    }

    // get points of shape and holes (keypoints based on segments parameter)

    extractPoints(divisions) {
        return {
            shape: this.getPoints(divisions),
            holes: this.getPointsHoles(divisions),
        };
    }

    /**
     * @override
     */
    copy(source) {
        super.copy(source);

        this.holes = [];

        for (let i = 0, l = source.holes.length; i < l; i++) {
            const hole = source.holes[i];

            this.holes.push(hole.clone());
        }

        return this;
    }

    /**
     * @override
     */
    toJSON() {
        const data = super.toJSON();

        // @ts-ignore
        data.uuid = this.uuid;
        // @ts-ignore
        data.holes = [];

        for (let i = 0, l = this.holes.length; i < l; i++) {
            const hole = this.holes[i];
            // @ts-ignore
            data.holes.push(hole.toJSON());
        }

        return data;
    }

    /**
     * @override
     */
    fromJSON(json) {
        super.fromJSON(json);

        this.uuid = json.uuid;
        this.holes = [];

        for (let i = 0, l = json.holes.length; i < l; i++) {
            const hole = json.holes[i];
            this.holes.push(new Path3().fromJSON(hole));
        }

        return this;
    }
}

export { Shape3 };
