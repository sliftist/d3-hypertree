"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presets = void 0;
const n_layouts_1 = require("../n/n-layouts");
const d3_hypertree_1 = require("../../d3-hypertree");
const unitdisk_1 = require("../../components/unitdisk/unitdisk");
const preset_layers_1 = require("./preset-layers");
const magic_filter_1 = require("./magic-filter");
const π = Math.PI;
const hasLazy = n => (n.hasOutChildren && n.isOutλ);
const isLeaf = n => !n.children || !n.children.length;
const isRoot = n => !n.parent;
const hasCircle = n => hasLazy(n) || isRoot(n) || isLeaf(n);
var nodeInitR = (c) => (ud, d) => c * ((d.children && d.parent) ? innerNodeScale(d) : 1);
var nodeScale = d => d.distScale * (hasLazy(d) ? .8 : 1);
var innerNodeScale = d => d.precalc.weightScale;
var arcWidth = d => .025 * d.distScale * d.precalc.weightScale;
const modelBase = () => ({
    langloader: ok => ok(),
    dataInitBFS: (ht, n) => {
        n.precalc.imageHref = undefined;
        n.precalc.icon = undefined;
        n.precalc.clickable = true;
        n.precalc.cell = true;
    },
    langInitBFS: (ht, n) => {
        n.precalc.label = undefined;
        n.precalc.wiki = undefined;
    },
    objects: {
        selections: [],
        pathes: [],
        traces: [],
    },
    layout: {
        type: n_layouts_1.layoutBergé,
        weight: (n) => (isLeaf(n) ? 1 : 0),
        initSize: .97,
        rootWedge: {
            orientation: 3 * π / 2,
            angle: 3 * π / 2
        }
    },
    filter: {
        type: 'magic',
        cullingRadius: .99,
        weightFilter: {
            magic: 160,
            alpha: 1.05,
            //weight:             n=> (isLeaf(n) ? 1 : 0),
            //weight:             n=> (isLeaf(n) ? 1 : Math.pow(n.height, 5)),
            weight: n => (isLeaf(n) ? 1 : n.height * n.height),
            rangeCullingWeight: { min: 4, max: 500 },
            rangeNodes: { min: 150, max: 500 },
        },
        focusExtension: 1.6,
        maxFocusRadius: .85,
        wikiRadius: .85,
        maxlabels: 25,
    },
    geometry: {
        decorator: unitdisk_1.UnitDisk,
        cacheUpdate: magic_filter_1.cacheUpdate,
        layers: preset_layers_1.layerSrc,
        layerOptions: {},
        clipRadius: 1,
        nodeRadius: nodeInitR(.01),
        nodeScale: nodeScale,
        nodeFilter: hasCircle,
        offsetEmoji: preset_layers_1.labeloffsets.labeloffset,
        offsetLabels: preset_layers_1.labeloffsets.labeloffset,
        linkWidth: arcWidth,
        linkCurvature: '-',
        captionBackground: 'all',
        captionFont: '6.5px Roboto',
        captionHeight: .04,
        transformation: new d3_hypertree_1.HyperbolicTransformation({
            P: { re: 0, im: 0 },
            θ: { re: 1, im: 0 },
            λ: .1
        })
    },
    interaction: {
        mouseRadius: .9,
        onCenterNodeChange: (n) => { },
        onWikiCenterNodeChange: (n) => { },
        onHoverNodeChange: (n) => { },
        onNodeSelect: () => { },
        onNodeHold: () => { },
        onNodeHover: () => { console.log("ON NODE HOVER============="); },
        λbounds: [1 / 40, .45],
        wheelFactor: 1.175,
    }
});
exports.presets = {
    modelBase: () => modelBase()
};
