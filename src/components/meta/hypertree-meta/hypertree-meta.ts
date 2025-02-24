import { HTML } from 'ducd'
import { UnitdiskMeta } from '../unitdisk-meta/unitdisk-meta'
import { LayerStackMeta } from '../layerstack-meta/layerstack-meta'
import { Hypertree } from '../../hypertree/hypertree'
import { UnitDiskNav } from '../../../d3-hypertree'

export class NoHypertreeMeta {
    public update = {
        parent: () => { },
        model: () => { },
        lang: () => { },
        layout: () => { },
        transformation: () => { }
    }
}

export class HypertreeMeta {
    private view
    private model: Hypertree
    private udView: UnitdiskMeta
    private lsView: LayerStackMeta

    constructor({ view, model }) {
        this.view = view
        this.model = model
        this.updateParent()
    }

    update = {
        parent: () => this.updateParent(),
        all: () => {
            // TODO:
        },
        model: () => {
            this.udView.update.model()
            this.lsView.update.data()
        },
        lang: () => {
            this.udView.update.lang()
        },
        layout: () => {
            this.udView.update.layout()
            this.lsView.update.data()
        },
        transformation: () => {
            this.udView.update.transformation()
            this.lsView.update.data()
        }
    }

    private updateParent() {

        this.udView = new UnitdiskMeta({
            view: { parent: this.view.parent, className: 'data', hypertree: this.model },
            model: this.model.unitdisk
        })

        this.lsView = new LayerStackMeta({
            view: { parent: this.view.parent, className: 'data', hypertree: this.model },
            model: this.model.unitdisk
        })
    }
}

export class HypertreeMetaNav {
    private view
    private model: Hypertree
    private udView: UnitdiskMeta
    private udNav: UnitdiskMeta

    private lsView: LayerStackMeta
    private lsNav: LayerStackMeta
    private lsNavParam: LayerStackMeta

    constructor({ view, model }) {
        this.view = view
        this.model = model
        this.updateParent()
    }

    update = {
        parent: () => this.updateParent(),
        model: () => {
            this.udView.update.model()
            this.udNav.update.model()
            this.lsView.update.data()
            this.lsNav.update.data()
            this.lsNavParam.update.data()
        },
        lang: () => {
            this.udView.update.lang()
            this.udNav.update.lang()
        },
        layout: () => {
            this.udView.update.layout()
            this.udNav.update.layout()
            this.lsView.update.data()
            this.lsNav.update.data()
            this.lsNavParam.update.data()
        },
        transformation: () => {
            this.udView.update.transformation()
            this.udNav.update.transformation()
            this.lsView.update.data()
            this.lsNav.update.data()
            this.lsNavParam.update.data()
        }
    }

    htmlCarUd = `
        <div class="left carousel carousel-slider" data-indicators="true">
            <div id="meta-ud-data" class="carousel-item"></div>
            <div id="meta-ud-nav" class="carousel-item"></div>            
        </div>`

    htmlCarLs = `
        <div class="right carousel carousel-slider" data-indicators="true">
            <div id="meta-ls-data" class="carousel-item"></div>
            <div id="meta-ls-bg" class="carousel-item"></div>
            <div id="meta-ls-nav" class="carousel-item"></div>
        </div>`

    private updateParent() {

        //this.view_.parent.innerHTML = '' // actually just remove this.view if present ... do less
        this.view.html = HTML.parse<HTMLElement>(this.htmlCarUd)()
        this.view.parent.appendChild(this.view.html)

        this.view.html2 = HTML.parse<HTMLElement>(this.htmlCarLs)()
        this.view.parent.appendChild(this.view.html2)

        const navUnitDisk = <UnitDiskNav>this.model.unitdisk
        this.udView = new UnitdiskMeta({
            view: { parent: this.view.html.querySelector('#meta-ud-data'), className: 'data', hypertree: this.model },
            model: navUnitDisk.mainView
        })
        this.udNav = new UnitdiskMeta({
            view: { parent: this.view.html.querySelector('#meta-ud-nav'), className: 'nav', hypertree: this.model },
            model: navUnitDisk.navParameter
        })

        this.lsView = new LayerStackMeta({
            view: { parent: this.view.html2.querySelector('#meta-ls-data'), className: 'data', hypertree: this.model },
            model: navUnitDisk.mainView
        })
        this.lsNav = new LayerStackMeta({
            view: { parent: this.view.html2.querySelector('#meta-ls-bg'), className: 'navBg', hypertree: this.model },
            model: navUnitDisk.navBackground
        })
        this.lsNavParam = new LayerStackMeta({
            view: { parent: this.view.html2.querySelector('#meta-ls-nav'), className: 'nav', hypertree: this.model },
            model: this.model.unitdisk.navParameter
        })
    }
}

