/* global browser, exampleCanRenderTest, itownsPort */
const assert = require('assert');
const lCOLOR = require('../../lib/Renderer/LayeredMaterialConstants').l_COLOR;

describe('globe', () => {
    it('should run', async function _() {
        const page = await browser.newPage();

        await page.setViewport({ width: 400, height: 300 });
        await page.goto(`http://localhost:${itownsPort}/examples/globe.html`);
        await page.waitFor('#viewerDiv > canvas');

        const result = await exampleCanRenderTest(page, this.test.fullTitle());

        assert.ok(result);
        page.close();
        await page.close();
    });

    it('should return the correct tile', async function _() {
        const page = await browser.newPage();

        await page.setViewport({ width: 400, height: 300 });
        await page.goto(`http://localhost:${itownsPort}/examples/globe.html`);
        await page.waitFor('#viewerDiv > canvas');

        await exampleCanRenderTest(page, this.test.fullTitle());

        const level = await page.evaluate(() =>
            globeView.pickObjectsAt(
                { x: 221, y: 119 })[0].object.level);

        assert.equal(2, level);
        page.close();
        await page.close();
    });
    it('should not add layers beyond the capabilities', async function _() {
        const page = await browser.newPage();

        await page.setViewport({ width: 400, height: 300 });
        await page.goto(`http://localhost:${itownsPort}/examples/globe.html`);
        await page.waitFor('#viewerDiv > canvas');

        await exampleCanRenderTest(page, this.test.fullTitle());

        const maxColorSamplerUnitsCount = await page
            .evaluate(type => globeView.wgs84TileLayer.level0Nodes[0]
                .material.textures[type].length, lCOLOR);
        const colorSamplerUnitsCount = await page.evaluate(() =>
                globeView.wgs84TileLayer.countColorLayersTextures([], globeView.getLayers(l => l.type === 'color')[0]));
        const limit = maxColorSamplerUnitsCount - colorSamplerUnitsCount;

        // add layers just below the capacity limit
        const underLimit = await page.evaluate(maxLayersCount =>
            itowns.Fetcher.json('./layers/JSONLayers/OrthosCRS.json').then((params) => {
                const promises = [];
                for (let i = 0; i < maxLayersCount; i++) {
                    const layerParams = Object.assign({}, params);
                    layerParams.id = `${layerParams.id}_${i}`;
                    promises.push(globeView.addLayer(layerParams));
                }
                return Promise.all(promises).then(() => true).catch(() => false);
            }), limit);

        // add one layer just over the capacity limit
        // verify if the error is handled
        const errorOverLimit = await page.evaluate(() =>
            itowns.Fetcher.json('./layers/JSONLayers/OrthosCRS.json').then((params) => {
                const layerParams = Object.assign({}, params);
                layerParams.id = 'max';
                return globeView.addLayer(layerParams).then(() => false).catch(() => true);
            }));

        assert.ok(underLimit);
        assert.ok(errorOverLimit);
        await page.close();
    });
    it('shouldn t add layer with id already used', async function _() {
        const page = await browser.newPage();

        await page.setViewport({ width: 400, height: 300 });
        await page.goto(`http://localhost:${itownsPort}/examples/globe.html`);
        await page.waitFor('#viewerDiv > canvas');

        await exampleCanRenderTest(page, this.test.fullTitle());

        const error = await page.evaluate(() => itowns.Fetcher.json('./layers/JSONLayers/Ortho.json').then(globeView.addLayer).catch(() => true));
        const colorLayersCount = await page.evaluate(() => globeView.getLayers(l => l.type === 'color').length);

        assert.ok(error && colorLayersCount === 1);
        page.close();
        await page.close();
    });
});
