//import { hierarchy, HierarchyNode } from 'd3-hierarchy'
//import { timer }                    from 'd3-timer'
//import { interpolateHcl, rgb }      from 'd3-color'

import * as d3                 from 'd3'
import { HTML }                from 'ducd'
import { N }                   from '../../models/n/n'
import { LoaderFunction }      from '../../models/n/n-loaders'
import { LayoutFunction }      from '../../models/n/n-layouts'
import { dfsFlat }             from '../../hyperbolic-math'
import { C, CktoCp, CptoCk }   from '../../hyperbolic-math'
import { sigmoid }             from '../../hyperbolic-math'
import { Transformation }      from '../../hyperbolic-transformation'

import { ILayer }              from '../layerstack/layer'
import { D3UpdatePatternArgs } from '../layerstack/d3updatePattern'
import { UnitDiskArgs }        from '../unitdisk/unitdisk'
import { UnitDisk }            from '../unitdisk/unitdisk'
import { IUnitDisk }           from '../unitdisk/unitdisk'

import { HypertreeMeta }       from '../meta/hypertree-meta/hypertree-meta'
import { NoHypertreeMeta }     from '../meta/hypertree-meta/hypertree-meta'

var htmlpreloader = `
    <div class="preloader-wrapper big active">
        <div class="spinner-layer spinner-red-only">
            <div class="circle-clipper left">
                <div class="circle"></div>
            </div>
            <div class="gap-patch">
                <div class="circle"></div>
            </div>
            <div class="circle-clipper right">
                <div class="circle"></div>
            </div>
        </div>
    </div>`

var bubbleSvgDef =
    `<defs>
        <radialGradient id="exampleGradient">            
            <stop offset="58%"   stop-color="rgba(255,255,255, .08)"/>            
            <stop offset="92%"   stop-color="rgba( 96, 96, 96, .08)"/>
            <stop offset="99.8%" stop-color="rgba( 36, 36, 36, .08)"/>
            <stop offset="100%"  stop-color="rgba( 35, 35, 35, .08)"/>
        </radialGradient>
    </defs>` 

export interface HypertreeArgs
{
    parent:         any,

    iconmap:        any,
    dataloader:     LoaderFunction,
    langloader:     (lang)=> (ok)=> void,

    weight:         (n:N) => number,
    layout:         LayoutFunction,
    onNodeSelect:   (n:N) => void,

    decorator:      { new(a: UnitDiskArgs) : IUnitDisk },

    ui : {
        clipRadius:     number,
        nodeRadius:     number,
        transformation: Transformation<N>,
        cacheUpdate:    (cache:UnitDisk)=> void,
        caption:        (hypertree:Hypertree, n:N)=> string,       
        layers:         ((ls:UnitDisk)=> ILayer)[],
    }
}

export interface IHypertree
{
    args:                 any,
    updateData:           (data)=> void,
    updateLang:           (langmap)=> void,
    updateSelection:      (selection)=> void,
    updateTransformation: (T)=> void
}

var htmlHomeBtn =
    `<button id="btnhome" class="btn btn-small waves-effect waves-orange pn">
        <i class="material-icons btn-icon-home">home</i>
    </button>`

var htmlNavBtn =
    `<button id="btnnav" class="btn btn-small waves-effect waves-orange pn">
        <i class="material-icons">near_me</i>        
    </button>`

var htmlMetaBtn =
    `<button id="btnmeta" class="btn btn-small waves-effect waves-orange pn">
        <!--<i class="material-icons">fingerprint</i>-->
        <!--<i class="material-icons">blur_on</i>-->
        <!--<i class="material-icons">memory</i>-->
        <i class="material-icons">layers</i>
    </button>`

var hypertreehtml =
    `<div class="unitdisk-nav">        
        <div class=tool-bar>
            ${htmlHomeBtn}
            ${htmlNavBtn}
            ${htmlMetaBtn}        
        </div>
        <svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="-0 0 1000 1000">
            ${bubbleSvgDef}
        </svg>        
        <div class="preloader"></div>        
    </div>`

/**
* pipeline implementation:
* ajax -> weights -> layout -> transformation -> unitdisk / langmaps
*
* states: pipeline, interaction*
*/
export class Hypertree 
{
    args           : HypertreeArgs
    unitdisk       : IUnitDisk
    hypertreeMeta  : HypertreeMeta
    data           : N
    langMap        : {}
    view           : HTMLElement
    animation      : boolean = false
    paths          : { 
        isSelected?:N, 
        isHovered?:N 
    }              = {}    
    modelMeta
    layoutMeta
    noHypertreeMeta

    constructor(args : HypertreeArgs) {
        this.args = args        
        this.update.parent()

        this.view.querySelector('#btnmeta').onclick = ()=> {
            this.noHypertreeMeta = NoHypertreeMeta
            this.noHypertreeMeta = undefined
            this.update.parent()
        }
    }

    update = {
        parent:         ()=> this.updateParent(),
        data:           ()=> this.updateParent(),
        lang:           ()=> this.updateParent(),        
        layout:         ()=> this.updateParent(),
        transformation: ()=> this.updateParent(),
        pathes:         ()=> this.updateParent()
    }

    private updateParent()
    {
        this.view = HTML.parse<HTMLElement>(hypertreehtml)()
        this.args.parent.appendChild(this.view)

        this.unitdisk = new this.args.decorator({
            parent:         this.view.querySelector('.unitdisk-nav > svg'),
            className:      'unitDisc',
            position:       'translate(520,500) scale(470)',
            hypertree:      this,
            data:           undefined,            
            transformation: this.args.ui.transformation,
            transform:      (n:N)=> this.unitdisk.args.transformation.transformPoint(n.z),
            layers:         this.args.ui.layers,
            cacheUpdate:    this.args.ui.cacheUpdate,
            caption:        (n:N)=> this.args.ui.caption(this, n),
            clipRadius:     this.args.ui.clipRadius,
            nodeRadius:     this.args.ui.nodeRadius            
        })

        this.hypertreeMeta = this.noHypertreeMeta || new this.unitdisk.HypertreeMetaType({ 
            view: { parent:this.args.parent },
            model: this
        })

        this.updateData()
        this.updateLang()
    }

    public updateData() : void {
        var t0 = performance.now()
        this.view.querySelector('.preloader').innerHTML = htmlpreloader
        this.unitdisk.args.data = undefined
        this.paths.isSelected = undefined
        this.paths.isHovered= undefined
        this.unitdisk.update.data()

        this.args.dataloader((d3h, t1)=> {
            var t2 = performance.now()
            var ncount = 1
            this.data = <N & d3.HierarchyNode<N>>d3
                .hierarchy(d3h)
                .each((n:any)=> n.mergeId = ncount++)
                //.sum(this.args.weight) // this.updateWeights()

            this.view.querySelector('.preloader').innerHTML = ''
            this.modelMeta = { Δ: [t1-t0, t2-t1, performance.now()-t2] }
            //this.unitdiskMeta.update.model()
            //this.unitdisk.update.ajax()
            this.hypertreeMeta.update.data()

            var t3 = performance.now()
            this.data = this.args.layout(this.data, this.args.ui.transformation.state)
            this.unitdisk.args.data = this.data
            this.args.ui.transformation.cache.N = this.data.descendants().length
            this.updateWeights()
            this.updateLang_()
            this.updateImgHref_()            
            this.layoutMeta = { Δ: performance.now()-t3 }
            //this.unitdisk.update.layoutMeta()
            this.hypertreeMeta.update.layout()

            this.animateUp()
        })
    }

    public updateLang() : void {
        this.args.langloader(langMap=> {            
            this.langMap = langMap
            this.updateLang_()
            this.updateTransformation()
        })
    }

    private updateLang_() {
        for (var n of dfsFlat(this.data, n=>true)) {
            n.label = this.args.ui.caption(this, n)
            n.labellen = undefined
        }
    }

    private updateImgHref_() {
        for (var n of dfsFlat(this.data, n=>true)) 
            n.imageHref = this.args.iconmap.fileName2IconUrl(n.data.name, n.data.type)                    
    }

    private updateWeights() : void {
        this.data.sum(this.args.weight)
        for (var n of dfsFlat(this.data, n=>true)) {
            n.weightScale = (Math.log2(n.value) || 1)
                / (Math.log2(this.data.value || this.data.children.length) || 1)
        }
        this.updateLayout()
    }

    private updateLayout() : void {        
        //app.toast('Layout')
        var t0 = performance.now()
        this.args.layout(this.data, this.args.ui.transformation.state)        
        this.layoutMeta = {
            Δ: performance.now()-t0
        }
        //this.unitdiskMeta.update.layout(this.args.ui.transformation.cache, performance.now() - t0)
        
        if (this.args.ui.transformation.cache.centerNode) {
            this.args.ui.transformation.state.P.re = -this.args.ui.transformation.cache.centerNode.z.re
            this.args.ui.transformation.state.P.im = -this.args.ui.transformation.cache.centerNode.z.im
        }

        requestAnimationFrame(()=> {
            this.unitdisk.update.transformation() 
            this.hypertreeMeta.update.layout()
            this.hypertreeMeta.update.transformation()
            //this.unitdiskMeta.update.layout()
            //this.unitdiskMeta.update.transformation()
            //this.layerStackMeta2.update.data()
            //this.layerStackMeta.update.data()            
        })
    }

    public updateTransformation() : void {
        requestAnimationFrame(()=> {
            this.unitdisk.update.transformation() 
            this.hypertreeMeta.update.transformation()
            //this.unitdiskMeta.update.transformation()
            //this.layerStackMeta2.update.data()
            //this.layerStackMeta.update.data()            
        })
    }

    public updatePath(pathId:string, n:N)
    {
        var old_ =  this.paths[pathId]
        this.paths[pathId] = n
        var new_ =  this.paths[pathId]

        if (old_)
            if (old_.ancestors) 
                for (var pn of old_.ancestors())
                    pn[pathId] = undefined
            else
                old_[pathId] = undefined

        if (new_)
            if (new_.ancestors) 
                for (var pn of new_.ancestors()) 
                    pn[pathId] = true // könnte alles sein oder?
            else
                new_[pathId] = true // könnte alles sein oder?

        //this.ui.updateSelection()
        //requestAnimationFrame(()=> this.unitdisk.updateTransformation())
        requestAnimationFrame(()=> {
            this.unitdisk.update.pathes()
            this.hypertreeMeta.update.transformation()
            //this.unitdiskMeta.update.transformation()
            //this.layerStackMeta2.update.data()
            //this.layerStackMeta.update.data()            
        })
    }

    private animateUp()
    {
        this.args.ui.transformation.state.P.re = 0
        this.args.ui.transformation.state.P.im = 0

        this.animation = true
        var step = 0, steps = 16
        var frame = ()=>
        {
            var p = step++/steps
            if (step > steps) 
            {
                this.animation = false
            }
            else 
            {
                var λ = .03 + p * .98
                var π = Math.PI
                var animλ = CptoCk({ θ:2*π*λ, r:1 })
                this.args.ui.transformation.state.λ.re = animλ.re
                this.args.ui.transformation.state.λ.im = animλ.im

                //app.toast('Layout')
                this.args.layout(this.data, this.args.ui.transformation.state)
                
                if (this.data
                    .leaves()
                    .reduce((max, n)=> Math.max(max, CktoCp(n.z).r), 0) > .95)                     
                {
                    this.animation = false
                    this.data.each((n:any)=> { 
                        n.zRef = n.z
                        n.strCacheZref = `${n.z.re} ${n.z.im}`
                    })
                }
                else 
                    requestAnimationFrame(()=> frame())

                this.unitdisk.update.data()
                this.hypertreeMeta.update.transformation()
                //this.unitdiskMeta.update.layout()
                //this.unitdiskMeta.update.transformation()
                //this.layerStackMeta2.update.data()
                //this.layerStackMeta.update.data()
            }
        }
        requestAnimationFrame(()=> frame())
    }

    public isAnimationRunning() {
        var view = this.unitdisk.args.transformation.isMoving()
        var nav = this.unitdisk.navParameter 
               && this.unitdisk.navParameter.args.transformation.isMoving()
        return view || nav || this.animation
    }
}

