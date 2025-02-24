"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceLayer = void 0;
const d3updatePattern_1 = require("../layerstack/d3updatePattern");
class TraceLayer {
    constructor(view, args) {
        this.update = {
            parent: () => this.attach(),
            data: () => this.d3updatePattern.update.data(),
            transformation: () => this.d3updatePattern.update.transformation(),
            style: () => this.d3updatePattern.update.style()
        };
        this.view = view;
        this.args = args;
        this.name = args.name;
    }
    attach() {
        this.d3updatePattern = new d3updatePattern_1.D3UpdatePattern({
            parent: this.view.parent,
            layer: this,
            data: this.args.data,
            name: this.args.name,
            className: 'trace-polyline',
            elementType: 'polyline',
            create: s => { },
            updateColor: s => { },
            updateTransform: s => s.attr("points", d => d.points
                .map(e => `${e.re}, ${e.im}`)
                .join(' '))
        });
    }
}
exports.TraceLayer = TraceLayer;
