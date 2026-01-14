import { Vector3 } from 'three';
import { CurvePath } from 'three';
import { EllipseCurve } from 'three';
import { SplineCurve } from 'three';
import { CubicBezierCurve } from 'three';
import { QuadraticBezierCurve } from 'three';
import { LineCurve3 } from 'three';

class Path3 extends CurvePath {
    constructor(points) {
        super();

        this.type = 'Path3';

        this.currentPoint = new Vector3();

        if (points) {
            this.setFromPoints(points);
        }
    }

    setFromPoints(points) {
        this.moveTo(points[0].x, points[0].y, points[0].z);

        for (let i = 1, l = points.length; i < l; i++) {
            this.lineTo(points[i].x, points[i].y, points[i].z);
        }

        return this;
    }

    moveTo(x, y, z) {
        this.currentPoint.set(x, y, z); // TODO consider referencing vectors instead of copying?

        return this;
    }

    lineTo(x, y, z) {
        const curve = new LineCurve3(this.currentPoint.clone(), new Vector3(x, y, z));
        this.curves.push(curve);

        this.currentPoint.set(x, y, z);

        return this;
    }

    /**
     * @override
     */
    copy(source) {
        super.copy(source);

        this.currentPoint.copy(source.currentPoint);

        return this;
    }

    /**
     * @override
     */
    toJSON() {
        const data = super.toJSON();

        // @ts-ignore
        data.currentPoint = this.currentPoint.toArray();

        return data;
    }

    /**
     * @override
     */
    fromJSON(json) {
        super.fromJSON(json);

        this.currentPoint.fromArray(json.currentPoint);

        return this;
    }
}

export { Path3 };
