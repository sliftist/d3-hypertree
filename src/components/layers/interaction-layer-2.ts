import * as d3 from 'd3'
import { ILayer } from '../layerstack/layer'
import { ILayerView } from '../layerstack/layer'
import { ILayerArgs } from '../layerstack/layer'
import { LayerStack } from '../layerstack/layerstack'
import { N } from '../../models/n/n'
import { C, Cp, maxR } from '../../models/transformation/hyperbolic-math'
import { CptoCk, CktoCp, ArrtoC } from '../../models/transformation/hyperbolic-math'
import { CaddC, CsubC, CmulR } from '../../models/transformation/hyperbolic-math'
import { clone } from '../../models/transformation/hyperbolic-math'
import { compose, shift } from '../../models/transformation/hyperbolic-math'
import { setHoverNodeCache } from '../../models/hypertree/preset-process'

const π = Math.PI

export interface InteractionLayer2Args extends ILayerArgs {
    mouseRadius,
    onClick
}

export class InteractionLayer2 implements ILayer {
    view: ILayerView
    args: InteractionLayer2Args
    name = 'interaction-2'

    mousedown: boolean
    dST
    htapi
    hoverpath

    constructor(view: ILayerView, args: InteractionLayer2Args) {
        this.view = view
        this.args = args
        this.htapi = this.view.hypertree.api
        this.hoverpath = this.view.hypertree.args.objects.pathes[0]
        this.mousedown = false
    }

    update = {
        parent: () => this.updateParent(),
        data: () => { },
        transformation: () => { },
        style: () => { }
    }

    private updateParent() {
        const mousehandlers = de => de
            .on('wheel', e => this.fireMouseWheelEvent())

            .on('mousedown', e => this.fireMouseDown())
            .on('mousemove', e => { this.fireNodeHover(this.findNodeByCell()); this.fireMouseMove() })
            .on('mouseup', e => this.fireMouseUp())
            .on('mouseout', e => { this.fireNodeHover(undefined); this.htapi.setPathHead(this.hoverpath, undefined) })
            .on('touchstart', e => this.fireTouchEvent('onPointerStart'))
            .on('touchmove', e => this.fireTouchEvent('onPointerMove'))
            .on('touchend', e => this.fireTouchEvent('onPointerEnd'))
            .on('touchcancel', e => this.fireTouchEvent('onPointerEnd'))

        this.view.parent
            .append('circle')
            .attr('class', 'mouse-circle')
            .attr('r', 5)
            .call(mousehandlers)

        this.view.parent
            .append('circle')
            .attr('class', 'mouse-circle-cursor')
            .attr('r', this.args.mouseRadius)
            .call(mousehandlers)
    }

    // just to keep the list above clear

    private fireMouseDown() {
        this.mousedown = true
        this.fireMouseEvent('onPointerStart')
    }

    private fireMouseMove() {
        if (this.mousedown)
            this.fireMouseEvent('onPointerMove')
        else {
            if (!this.view.hypertree.isInitializing
                && !this.view.hypertree.isAnimationRunning())
                this.htapi.setPathHead(this.hoverpath, this.findNodeByCell())
        }
    }

    private fireMouseUp() {
        this.mousedown = false
        this.fireMouseEvent('onPointerEnd')
    }

    private async fireNodeHover(n) {
        //fire onNodeHover if the node is close enough
        //or if the node is undefined, we will also tell the onNodeHover function

        if (this.mousedown) { //when we are dragging, hide the popup
            setHoverNodeCache(undefined, this.view.unitdisk.cache);
            this.view.hypertree.args.interaction.onHoverNodeChange(undefined);
            return;
        }

        if ((!this.view.unitdisk.cache.lastHovered && !n) || (this.view.unitdisk.cache.lastHovered && n && this.view.unitdisk.cache.lastHovered.data.id === n.data.id)) return;

        if ((n && n.distScale > 0.5)) {
            setHoverNodeCache(n, this.view.unitdisk.cache);
            if (this.view.hypertree.args.interaction.onHoverNodeChange) {
                this.view.hypertree.args.interaction.onHoverNodeChange(n);
            }
        } else {
            await this.delay(100);
            if (!this.view.unitdisk.cache.lastHovered) return;

            setHoverNodeCache(undefined, this.view.unitdisk.cache);
            if (this.view.hypertree.args.interaction.onHoverNodeChange) {
                this.view.hypertree.args.interaction.onHoverNodeChange(undefined);
            }
        }
    }

    private delay(ms) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(null), ms);
        })
    }

    //-----------------------------------------------------------------------------------------

    private fireMouseEvent(eventName: string) {
        d3.event.stopPropagation()
        d3.event.preventDefault()

        const m = this.currMousePosAsC()
        requestAnimationFrame(() => {
            if (this[eventName]('mouse', m)) {
                this.view.hypertree.update.transformation()
            }
        })
    }

    private fireMouseWheelEvent() {
        d3.event.stopPropagation()
        d3.event.preventDefault()

        const mΔ = d3.event.deltaY
        const oldλp = this.view.unitdisk.args.transformation.state.λ
        const Δsens = this.view.hypertree.args.interaction.wheelFactor
        const newλp = (mΔ >= 0 ? oldλp / Δsens : oldλp * Δsens) //- λΔ

        if (newλp > this.view.hypertree.args.interaction.λbounds[0] &&
            newλp < this.view.hypertree.args.interaction.λbounds[1]) {
            const m = this.currMousePosAsArr()

            requestAnimationFrame(() => {
                const t = this.view.unitdisk.args.transformation
                const preservingNode = this.findUnculledNodeByCell(ArrtoC(m))
                t.onDragλ(newλp)
                this.view.hypertree.updateLayoutPath_(preservingNode) // only path to center
                t.state.P = compose(t.state, shift(t.state, { re: 0, im: 0 }, preservingNode.cache)).P

                this.view.hypertree.update.transformation()
            })
            //this.view.layerstack.layers['labels-force'].update.force()   
        }
    }

    private fireTouchEvent(eventName: string) {
        d3.event.stopPropagation()
        d3.event.preventDefault()

        const changedTouches = d3.event.changedTouches
        let update = false
        for (let i = 0; i < changedTouches.length; ++i) {
            const t = changedTouches[i]
            const pid = t.identifier
            const m = ArrtoC(d3.touches(this.view.parent.node(), changedTouches)[i])

            update = this[eventName](pid, m) || update
        }
        requestAnimationFrame(() => {
            if (update)
                this.view.hypertree.update.transformation()
        })
    }
    //-----------------------------------------------------------------------------------------
    private pinchState: {
        pinchInitDist: number,
        pinchInitλp: number,
        pinchcenter: C,
        pinchPreservingNode: N
        onPointerStart,
        onPointerMove,
        onPointerEnd
    }
    private panStart: C = null
    private pinchInitDist: number = null
    private pinchInitλp: number = null
    private nopinch: boolean = null
    private pinchcenter: C = null
    private pinchPreservingNode = null

    private onPointerStart(pid, m: C) {
        if (CktoCp(m).r >= 1)
            return false

        this.view.hypertree.args.objects.traces.push({
            id: pid,
            points: [m]
        })

        if (this.view.hypertree.args.objects.traces.length === 1) {
            //this.view.unitdisk.args.transformation.onDragStart(m)
            this.dST = clone(this.view.unitdisk.args.transformation.state)
            this.view.unitdisk.isDraging = true
            this.panStart = m
            this.nopinch = true
        }
        else if (this.view.hypertree.args.objects.traces.length === 2) {
            const t0 = this.view.hypertree.args.objects.traces[0]
            const t0e = t0.points[t0.points.length - 1]
            this.pinchcenter = CmulR(CaddC(t0e, m), .5)
            this.view.unitdisk.pinchcenter = this.pinchcenter
            this.pinchPreservingNode = this.findUnculledNodeByCell(this.pinchcenter)
            this.pinchInitDist = this.dist(t0e, m)
            this.pinchInitλp = this.view.unitdisk.args.transformation.state.λ
            this.nopinch = false
        }
        else { }
        return false
    }

    private onPointerMove(pid, m) {
        const trace = this.findTrace(pid)
        if (!trace) {
            console.warn('onPointerMove ')
            return false
        }
        trace.points.push(m)

        if (this.view.hypertree.args.objects.traces.length === 1) {
            //this.view.unitdisk.args.transformation.onDragP(this.panStart, m)
            const t = this.view.unitdisk.args.transformation
            t.state.P = compose(this.dST, shift(this.dST, this.panStart, maxR(m, .9))).P
        }
        else if (this.view.hypertree.args.objects.traces.length === 2) {
            const t0 = this.view.hypertree.args.objects.traces[0]
            const t0e = t0.points[t0.points.length - 1]
            const t1 = this.view.hypertree.args.objects.traces[1]
            const t1e = t1.points[t1.points.length - 1]
            const dist = this.dist(t0e, t1e)
            const f = dist / this.pinchInitDist
            const newλp = this.pinchInitλp * f

            if (newλp > this.view.hypertree.args.interaction.λbounds[0] &&
                newλp < this.view.hypertree.args.interaction.λbounds[1]) {
                const pinchcenter2 = maxR(CmulR(CaddC(t0e, t1e), .5), this.args.mouseRadius)

                const t = this.view.unitdisk.args.transformation
                t.onDragλ(newλp)
                this.view.hypertree.updateLayoutPath_(this.pinchPreservingNode) // only path to center
                t.state.P = compose(t.state, shift(t.state, { re: 0, im: 0 }, this.pinchPreservingNode.cache)).P
                t.state.P = compose(t.state, shift(t.state, this.pinchcenter, pinchcenter2)).P

                this.pinchcenter = CmulR(CaddC(this.pinchcenter, pinchcenter2), .5)
                this.view.unitdisk.pinchcenter = this.pinchcenter
            }
        }
        else { }
        return true
    }

    private onPointerEnd(pid, m) {
        this.view.hypertree.args.objects.traces
            = this.view.hypertree.args.objects.traces.filter(e => e.id !== pid)

        this.pinchcenter = undefined
        this.view.unitdisk.pinchcenter = this.pinchcenter
        this.pinchPreservingNode = undefined

        if (this.view.hypertree.args.objects.traces.length === 0) {
            //this.view.unitdisk.args.transformation.onDragEnd(m)
            this.dST = undefined
            this.view.unitdisk.isDraging = false

            if (this.dist(this.panStart, m) < .006 && this.nopinch) {
                if (CktoCp(m).r < 1) {
                    this.click(m)
                    return false
                }
            }
        }
        else if (this.view.hypertree.args.objects.traces.length === 1) {
            //this.view.unitdisk.args.transformation.onDragStart(m)
            const otherPoints = this.view.hypertree.args.objects.traces[0].points
            this.panStart = otherPoints[otherPoints.length - 1] //others.lastpoint

            this.dST = clone(this.view.unitdisk.args.transformation.state)
            this.view.unitdisk.isDraging = true
        }
        else { }
        return true
    }

    //-----------------------------------------------------------------------------------------
    private findTrace(pid) {
        return this.view.hypertree.args.objects.traces.find(e => e.id === pid)
    }

    private dist(a: C, b: C) {
        const diff = CsubC(a, b)
        return Math.sqrt(diff.re * diff.re + diff.im * diff.im)
    }

    private click(m: C) {
        const q = this.view.unitdisk.cache.voronoiDiagram.find(m.re, m.im)
        const n = q ? q.data : undefined
        console.log('click', this.dist(this.panStart, m), n, this.view.unitdisk.args.transformation.cache.centerNode)

        if (!this.view.unitdisk.layerStack.layers['cells'].args.invisible) {
            this.ripple(n, m, () => {
                if (!this.view.hypertree.isAnimationRunning())
                    this.view.hypertree.args.interaction.onNodeClick(n, m, this)
            })
        }
        else {
            if (!this.view.hypertree.isAnimationRunning())
                this.view.hypertree.args.interaction.onNodeClick(n, m, this)
        }
    }

    public ripple(n: N, m: C, ok, useClip = true) {
        if (useClip && !this.view.unitdisk.layerStack.layers['cells'].args.invisible) {
            const rippleClip = this.view.parent
                .append('clipPath')
                .attr('id', `cell-clip-${n.mergeId}`)
                .html(`<use xlink:href="#cell-${n.mergeId}"></use>`)

            const rippleCircle = this.view.parent
                .insert('g', ':first-child')
                .attr('class', 'ripple-world')
                .attr('clip-path', `url(#cell-clip-${n.mergeId})`)
                .append('circle')
                .attr('class', 'ripple-circle')
                .attr('r', .1)
                .attr('cx', m.re)
                .attr('cy', m.im)
                .attr('transform-origin', `${m.re}  ${m.im}`)
                .on('animationend', () => {
                    rippleCircle.remove()
                    rippleClip.remove()
                    ok()
                })
        }
        else {
            const rippleCircle = this.view.parent
                .insert('g', ':first-child')
                .attr('class', 'ripple-world')
                .append('circle')
                .attr('class', 'ripple-circle')
                .attr('r', .1)
                .attr('cx', m.re)
                .attr('cy', m.im)
                .attr('transform-origin', `${m.re}  ${m.im}`)
                .on('animationend', () => {
                    rippleCircle.remove()
                    ok()
                })
        }
    }

    private currMousePosAsArr = () => d3.mouse(this.view.parent.node())
    private currMousePosAsC = () => ArrtoC(this.currMousePosAsArr())
    private findNodeByCell = () => {
        var m = this.currMousePosAsArr()
        var find = this.view.unitdisk.cache.voronoiDiagram.find(m[0], m[1])
        return find ? find.data : undefined
    }

    private findUnculledNodeByCell = (m: C) => {
        const voronoiLayout = d3.voronoi<N>()
            .x(d => { console.assert(typeof d.cache.re === 'number'); return d.cache.re; })
            .y(d => { console.assert(typeof d.cache.re === 'number'); return d.cache.im; })
            //.x(d=> d.cache.re)
            //.y(d=> d.cache.im)
            .extent([[-2, -2], [2, 2]])
        const voronoiDiagram = voronoiLayout(this.view.unitdisk.cache.unculledNodes)
        const find = voronoiDiagram.find(m.re, m.im)
        return find ? find.data : undefined
    }
}