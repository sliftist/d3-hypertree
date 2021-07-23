"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doImageStuff = exports.doLabelStuff = exports.setHoverNodeCache = exports.doVoronoiStuff = void 0;
function doVoronoiStuff(ud, cache) {
    //voro muss mindestens clickable enthalten für mousetonode bei click
    cache.voronoiDiagram = ud.voronoiLayout(cache.unculledNodes.filter((n) => n.precalc.clickable));
    cache.cells = cache.voronoiDiagram.polygons();
}
exports.doVoronoiStuff = doVoronoiStuff;
function setHoverNodeCache(node, cache) {
    cache.lastHovered = node;
}
exports.setHoverNodeCache = setHoverNodeCache;
/*
cache.emojis = hasicon
cache.labels = haslabel + inpath - hasicon
cache.wikis  = haslabel + inpath - labels - wikis
*/
function doLabelStuff(ud, cache) {
    var labels = cache.unculledNodes
        .filter((e) => e.precalc.label || e.precalc.icon);
    var stdlabels = labels.filter(e => !e.parent || !e.isOutλ);
    let damping = 1;
    while (stdlabels.length > ud.view.hypertree.args.filter.maxlabels) {
        stdlabels = stdlabels.filter(n => { var _a; return (n.precalc.cullingWeight * (n.parent === cache.centerNode ? 4 : 1) > (n.minWeight * damping)) || !n.parent || ((_a = n.pathes) === null || _a === void 0 ? void 0 : _a.isPartOfAnyHoverPath); });
        damping /= .8;
    }
    //require labels to be shown for children of centernode;
    //Also, if the node is on a hover path, show the label;
    //var requiredLabels = labels.filter(n => n.pathes.isPartOfAnyHoverPath);
    //if (cache.centerNode.children.length < ud.view.hypertree.args.filter.maxlabels) {
    //    requiredLabels = requiredLabels.concat(labels.filter(x => x.parent === cache.centerNode));
    //}
    //cache.labels = stdlabels.concat(requiredLabels);
    cache.labels = stdlabels;
}
exports.doLabelStuff = doLabelStuff;
function doImageStuff(ud, cache) {
    cache.images = cache.unculledNodes
        .filter((e) => e.precalc.imageHref);
}
exports.doImageStuff = doImageStuff;
