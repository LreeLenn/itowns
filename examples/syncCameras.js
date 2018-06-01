/* global itowns, document, GuiTools, Promise */

// Position near Gerbier mountain.
var positionOnGlobe = { longitude: 4.838, latitude: 45.756, altitude: 1000 };
var extent = new itowns.Extent(
    'EPSG:3946',
    1837816.94334, 1847692.32501,
    5170036.4587, 5178412.82698);

// `viewerDiv` will contain iTowns' rendering area (`<canvas>`)
var viewerDiv = document.getElementById('viewerDiv');
var planarDiv = document.getElementById('planarDiv');

// Instanciate iTowns GlobeView*
var globeView = new itowns.GlobeView(viewerDiv, positionOnGlobe);
var planarView = new itowns.PlanarView(planarDiv, extent);

var promises = [];
// var THREE = itowns.THREE;
var menuGlobe = new GuiTools('menuDiv', globeView);
var overGlobe = true;

// eslint-disable-next-line
new itowns.PlanarControls(planarView, {});

function addLayerCb(layer) {
    return globeView.addLayer(layer);
}

viewerDiv.addEventListener('mousemove', function _() {
    overGlobe = true;
}, false);

planarDiv.addEventListener('mousemove', function _() {
    overGlobe = false;
}, false);

promises.push(itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(addLayerCb));

exports.view = globeView;
exports.initialPosition = positionOnGlobe;

// Listen for globe full initialisation event
globeView.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function globeInitialized() {
    // eslint-disable-next-line no-console
    console.info('Globe initialized');
    Promise.all(promises).then(function init() {
        var planarCamera = planarView.camera.camera3D;
        var globeCamera = globeView.camera.camera3D;
        var params;
        menuGlobe.addImageryLayersGUI(globeView.getLayers(function filterColor(l) { return l.type === 'color'; }));
        menuGlobe.addElevationLayersGUI(globeView.getLayers(function filterElevation(l) { return l.type === 'elevation'; }));

        function sync() {
            if (overGlobe) {
                params = itowns.CameraUtils
                    .getTransformCameraLookingAtTarget(globeView, globeCamera);
                itowns.CameraUtils.transformCameraToLookAtTarget(planarView, planarCamera, params);
            } else {
                params = itowns.CameraUtils
                    .getTransformCameraLookingAtTarget(planarView, planarCamera);
                itowns.CameraUtils.transformCameraToLookAtTarget(globeView, globeCamera, params);
            }
        }
        sync();
        globeView.addFrameRequester(itowns.MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE, sync);
        planarView.addFrameRequester(itowns.MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE, sync);
    }).catch(console.error);
});

planarView.addLayer({
    url: 'https://download.data.grandlyon.com/wms/grandlyon',
    networkOptions: { crossOrigin: 'anonymous' },
    type: 'color',
    protocol: 'wms',
    version: '1.3.0',
    id: 'wms_imagery',
    name: 'Ortho2009_vue_ensemble_16cm_CC46',
    projection: 'EPSG:3946',
    format: 'image/jpeg',
    updateStrategy: {
        type: itowns.STRATEGY_DICHOTOMY,
        options: {},
    },
}).then(function placePlaneCamera() {
});
