/* global describe, it */
import * as THREE from 'three';
import assert from 'assert';
import Coordinates, { ellipsoidSizes } from '../src/Core/Geographic/Coordinates';
import Ellipsoid from '../src/Core//Math/Ellipsoid';
import CameraUtils from '../src/utils/CameraUtils';
import DEMUtils from '../src/utils/DEMUtils';

THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

DEMUtils.getElevationValueAt = () => {
    const result = { z: 0 };
    return result;
};

const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2();
const ellipsoid = new Ellipsoid(ellipsoidSizes());

function pickEllipsoid(camera) {
    raycaster.setFromCamera(center, camera);
    return ellipsoid.intersection(raycaster.ray);
}

const view = {};
const camera = new THREE.PerspectiveCamera();

view.getPickingPositionFromDepth = function getPickingPositionFromDepth() {
    return pickEllipsoid(camera);
};
view.referenceCrs = 'EPSG:4978';
view.getLayers = () => [{
    extent: {
        crs() {
            return 'EPSG:4326';
        },
    },
}];
view.addFrameRequester = () => {};
view.removeFrameRequester = () => {};
view.notifyChange = () => { camera.updateMatrixWorld(true); };

const range = 25000000;
const coord = new Coordinates('EPSG:4326', 2.35, 48.85, 0);

/*
// FIX ME convert
console.log(coord.longitude());
console.log(coord.as(view.referenceCrs).as('EPSG:4326').longitude());

coord._values[0] = (2.35 + 1);
// problem with
coord._normal = undefined;
console.log(coord.longitude());
const a = coord.as(view.referenceCrs);

const b = a.as('EPSG:4326');
console.log(b.longitude());
*/


function equalToFixed(value1, value2, toFixed) {
    assert.equal(value1.toFixed(toFixed), value2.toFixed(toFixed));
}

describe('Camera utils unit test', function () {
    it('init like expected', function () {
        // FIX ME doesn't work without tilt and heading
        const params = { range, coord, tilt: 88, heading: 0 };
        CameraUtils.transformCameraToLookAtTarget(view, camera, params).then(() => {
            const result = CameraUtils.getTransformCameraLookingAtTarget(view, camera);
            equalToFixed(result.range, params.range, 1);
            equalToFixed(result.coord.longitude(), params.coord.longitude(), 4);
            equalToFixed(result.coord.latitude(), params.coord.latitude(), 4);
        });
    });
    it('should set range like expected', function () {
        const params = { range: 10000 };
        CameraUtils.transformCameraToLookAtTarget(view, camera, params).then(() => {
            const range = CameraUtils.getTransformCameraLookingAtTarget(view, camera).range;
            equalToFixed(range, params.range, 1);
        });
    });
    it('should look at coordinate like expected', function () {
        const params = { coord: coord.clone() };
        // PROBLEM because _normal is not reset
        // params.coord._values[0]++;
        // params.coord._values[1]++;
        params.coord.set(coord.crs, params.coord.longitude() + 1, params.coord.latitude() + 1, 0);
        CameraUtils.transformCameraToLookAtTarget(view, camera, params).then(() => {
            const result = CameraUtils.getTransformCameraLookingAtTarget(view, camera);
            equalToFixed(result.coord.longitude(), params.coord.longitude(), 4);
            equalToFixed(result.coord.latitude(), params.coord.latitude(), 4);
        });
    });
    it('should tilt like expected', function () {
        const params = { tilt: 38 };
        CameraUtils.transformCameraToLookAtTarget(view, camera, params).then(() => {
            const tilt = CameraUtils.getTransformCameraLookingAtTarget(view, camera).tilt;
            equalToFixed(tilt, params.tilt, 4);
        });
    });
    it('should heading like expected', function () {
        const params = { heading: 147 };
        CameraUtils.transformCameraToLookAtTarget(view, camera, params).then(() => {
            const heading = CameraUtils.getTransformCameraLookingAtTarget(view, camera).heading;
            equalToFixed(heading, params.heading, 4);
        });
    });
    it('should heading, tilt, range and coordinate like expected', function () {
        const params = { heading: 17, tilt: 80, range: 20000, coord: coord.clone() };
        params.coord.set(coord.crs, params.coord.longitude() + 5, params.coord.latitude() + 5, 0);
        CameraUtils.transformCameraToLookAtTarget(view, camera, params).then(() => {
            const result = CameraUtils.getTransformCameraLookingAtTarget(view, camera);
            equalToFixed(result.heading, params.heading, 4);
            equalToFixed(result.tilt, params.tilt, 4);
            equalToFixed(result.range, params.range, 1);
            equalToFixed(result.coord.longitude(), params.coord.longitude(), 4);
            equalToFixed(result.coord.latitude(), params.coord.latitude(), 4);
        });
    });
    it('should heading, tilt, range and coordinate like expected with animation (200ms)', function () {
        const params = { heading: 17, tilt: 80, range: 20000, coord: coord.clone(), time: 200 };
        params.coord.set(coord.crs, params.coord.longitude() + 3, params.coord.latitude() + 4, 0);
        CameraUtils.animateCameraToLookAtTarget(view, camera, params).then(() => {
            const result = CameraUtils.getTransformCameraLookingAtTarget(view, camera);
            equalToFixed(result.heading, params.heading, 4);
            equalToFixed(result.tilt, params.tilt, 4);
            equalToFixed(result.range, params.range, 1);
            equalToFixed(result.coord.longitude(), params.coord.longitude(), 4);
            equalToFixed(result.coord.latitude(), params.coord.latitude(), 4);
        });
    });
});

