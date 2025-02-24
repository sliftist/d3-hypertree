"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.navBackgroundLayers = exports.navBgNodeR = void 0;
const hyperbolic_math_1 = require("../../models/transformation/hyperbolic-math");
const hyperbolic_math_2 = require("../../models/transformation/hyperbolic-math");
const hyperbolic_math_3 = require("../../models/transformation/hyperbolic-math");
const d3updatePattern_1 = require("../layerstack/d3updatePattern");
const cell_layer_1 = require("../layers/cell-layer");
const background_layer_1 = require("../layers/background-layer");
const symbol_layer_1 = require("../layers/symbol-layer");
const link_layer_1 = require("../layers/link-layer");
const label_layer_1 = require("../layers/label-layer");
exports.navBgNodeR = .012;
const arcWidth = (d) => .022
    * d.distScale
    * d.precalc.weightScale;
const nodeRadiusOffset = (ud) => (d) => hyperbolic_math_1.CptoCk({
    θ: (d.layoutReference || d.layout).zp.θ,
    r: exports.navBgNodeR
});
const labelDelta = (ud) => (d, i, v) => hyperbolic_math_2.CaddC(nodeRadiusOffset(ud)(d), d3updatePattern_1.bboxOffset(d, 'labellen-bg', d.layoutReference.zp || hyperbolic_math_1.CktoCp(d.layout.z)));
exports.navBackgroundLayers = [
    (v, ud) => new background_layer_1.BackgroundLayer(v, {}),
    (v, ud) => new cell_layer_1.CellLayer(v, {
        invisible: true,
        hideOnDrag: true,
        clip: '#circle-clip' + ud.args.clipRadius,
        data: () => ud.cache.cells
    }),
    (v, ud) => new link_layer_1.ArcLayer(v, {
        name: 'link-arcs',
        className: 'arc',
        curvature: ud.view.hypertree.args.geometry.linkCurvature,
        data: () => ud.cache.links,
        nodePos: (n) => (n.layoutReference || n.layout).z,
        nodePosStr: (n) => (n.layoutReference || n.layout).zStrCache,
        width: (n) => arcWidth(n),
        classed: (s, w) => { }
    }),
    (v, ud) => new link_layer_1.ArcLayer(v, {
        name: 'link-arcs-focus',
        className: 'arc-focus',
        curvature: ud.view.hypertree.args.geometry.linkCurvature,
        data: () => ud.cache.links.filter(n => n.parent.cachep.r < .6),
        nodePos: (n) => (n.layoutReference || n.layout).z,
        nodePosStr: (n) => (n.layoutReference || n.layout).zStrCache,
        width: (d) => arcWidth(d) + (.005 * d.dampedDistScale),
        classed: (s, w) => { }
    }),
    (v, ud) => new link_layer_1.ArcLayer(v, {
        name: 'path-arcs',
        className: 'arc',
        curvature: ud.view.hypertree.args.geometry.linkCurvature,
        data: () => ud.cache.paths,
        nodePos: (n) => (n.layoutReference || n.layout).z,
        nodePosStr: (n) => (n.layoutReference || n.layout).zStrCache,
        width: (d) => arcWidth(d) + (.013 * d.dampedDistScale),
        classed: s => s
            .classed("hovered-path-nav", d => d.pathes && d.pathes.isPartOfAnyHoverPath)
            .classed("selected-path-nav", d => d.pathes && d.pathes.isPartOfAnySelectionPath)
            .style("stroke", d => d.pathes && d.pathes.finalcolor)
    }),
    (v, ud) => new label_layer_1.LabelLayer(v, {
        invisible: true,
        hideOnDrag: true,
        name: 'emojis',
        className: 'caption label-big',
        data: () => ud.cache.emojis,
        text: (d) => d.precalc.icon,
        delta: labelDelta(ud),
        transform: (d, delta) => ` translate(${hyperbolic_math_3.CtoStr(hyperbolic_math_2.CaddC((d.layoutReference || d.layout).z, delta))})`
    }),
    (v, ud) => new label_layer_1.LabelLayer(v, {
        name: 'labels',
        className: 'caption label-big',
        data: () => ud.view.hypertree.args.objects.selections,
        text: (d) => d.precalc.label,
        delta: labelDelta(ud),
        transform: (d, delta) => ` translate(${hyperbolic_math_3.CtoStr(hyperbolic_math_2.CaddC((d.layoutReference || d.layout).z, delta))})`
    }),
    (v, ud) => new symbol_layer_1.SymbolLayer(v, {
        name: 'symbols',
        data: () => ud.cache.spezialNodes,
        r: (d) => .03,
        transform: (d) => ` translate(${(d.layoutReference || d.layout).zStrCache})`
            + ` scale(${d.dampedDistScale})`,
    }),
];
