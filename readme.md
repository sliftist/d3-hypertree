<!--
<p align="justify">
<p align="center">
<a href="https://glouwa.github.io/d3-hypertree/">
  <img src="docs/img/screenshot-light-github.png?raw=true">
</a>
</p>
</p>
-->

<!--
<iframe width="590" height="590" src="https://glouwa.github.io/" frameborder="0" allowfullscreen="allowfullscreen"></iframe>

<iframe width="560" height="315" src="http://www.youtube.com/embed/t6kxOXOJj8E" frameborder="0" allowfullscreen="allowfullscreen"></iframe>
-->

# D3-Hypertree
<!--
<p align="justify">
<p align="center">
A Scalable Intercative Web Component for Hyperbolic Tree Visualisations.
</p>
</p>
-->

<a href="https://glouwa.github.io/d3-hypertree/"><img 
src="docs/img/screenshot-light-github.png?raw=true" width="170" align="left" hspace="10" vspace="16"></a>

- Uses same data format as [d3.hierarchy()](https://github.com/d3/d3-hierarchy#hierarchy) 
- Scalable up to 1000 nodes
- Scalable up to 50k nodes with weight culling and primeter culling
- Mouse and touch interaction  
- Configurable layers
- Animation API 
<br>
<br>
<br>
<br>
<br>


## Resources
- [API Reference](https://glouwa.github.io/d3-hypertree/)
- [Live Demos](https://glouwa.github.io/d3-hypertree-examples/)
- [HTML / Webpack / Python Examples](https://github.com/glouwa/d3-hypertree-examples/)

## Installation

```bash
npm install d3-hypertree --save
```
`node_modules/d3-hypertree/dist/` will contain all necessary files.

<b>Or</b> download the [latest release](https://cdn.jsdelivr.net/npm/d3-hypertree@1.1.0/dist/)
of the prebuilt bundle if npm is not used. 
The prebuilt bundle declares the global variable `hyt`, 
therefore an import as in the usage example below is not necessary.



Add the following lines to your page:
```html
<link  href="index-browser-light.css" rel="stylesheet">
<script src="d3-hypertree.js"></script>
```

## Webpack

D3-hypertree is tested with webpack. 
Dont forget to add the hypertree css to your projects.
To make the example snippets compatible to the prebuilt bundle,
the following usage examples will assume an import like this:  
```typescript
import * as hyt from 'd3-hypertree'
```
Experts might prefer to import specific classes like `d3-hypertree/components/hypertree` to optimize bundle size.

## Usage

To begin a minimal example of creating a hypertree component is simple.
Only parent DOM element and data source, in this case a file in d3 JSON format is sufficient.

```typescript
new hyt.Hypertree(
    {
        parent: document.body,        
    },
    {        
        dataloader: hyt.loaders.fromFile('data/LDA128-ward.d3.json'),
        //dataloader: ok=> ok(d3.hierarchy(...)),
        //dataloader: ok=> ok(d3.stratify()...(table)),        
    }
)
```
You will see a hypertree without any labels or other features. See [API Reference](https://glouwa.github.io/d3-hypertree/). for more configuration options.

The cheat sheet below shows a hypertree component with all available options.

## Options Cheat Sheet

This example shows a component instantiation using most features. For detailed descriptions and a complete list of features see 
[API Reference](https://glouwa.github.io/d3-hypertree/).

```typescript
new hyt.Hypertree(
    {
        id:                     'my-component',
        classes:                'add-class another-class',
        parent:                 document.body,        
        preserveAspectRatio:    'xMidYMid meet'
    },
    {
        dataloader?:            LoaderFunction   
        dataInitBFS:            (ht:Hypertree, n:N)=> void       // emoji, imghref
        langInitBFS:            (ht:Hypertree, n:N)=> void       // text, wiki, clickable, cell,
        objects: {
            roots:              N[]
            pathes:             Path[]
            selections:         N[]    
        }
        layout: {
            type:               LayoutFunction
            weight:             (n:N)=> number
            initSize:           number
            rootWedge: {
                orientation:    number
                angle:          number
            }
        }
        filter: {
            cullingRadius:      number
            weightFilter:       null | number | {            
                weight:         (n)=> number
                rangeWeight:    { min:number, max:number }
                rangeNodes:     { min:number, max:number }
                alpha:          number
            }
            focusExtension:     number
            maxFocusRadius:     number
            wikiRadius:         number
            maxlabels:          number       
        }       
        geometry: {        
            layers:            ((v, ls:IUnitDisk)=> ILayer)[]
            layerOptions:      {
                cells: {
                    invisible:  false,
                    hideOnDrag: false,
                    // + layer specific properties 
                },
            }
            nodeRadius:        (ud:IUnitDisk, n:N)=> number
            nodeScale:         (n:N)=> number
            nodeFilter:        (n:N)=> boolean
            offsetEmoji:       (d, i, v)=> C
            offsetLabels:      (d, i, v)=> C

            captionBackground: 'all' | 'center' | 'root' | 'none' // x 
            captionFont:       string
            captionHeight:     number

            linkWidth:         (n:N)=> number
            linkCurvature:     ArcCurvature
        }
        interaction: {          
            //type:               'clickonly' | 'selction' | 'multiselection' | centernodeselectable'
            mouseRadius:        number,
            onNodeSelect:       (n:N)=> void
            onNodeHold:         ()=>void                          // x 
            onNodeHover:        ()=>void                          // x 
            λbounds:            [ number, number ]
            wheelSensitivity:   number
        }
    }
)
```
