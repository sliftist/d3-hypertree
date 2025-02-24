import { ILayer } from '../layerstack/layer';
import { ILayerView } from '../layerstack/layer';
import { ILayerArgs } from '../layerstack/layer';
import { D3UpdatePattern } from '../layerstack/d3updatePattern';
export interface NodeLayerArgs extends ILayerArgs {
    name: string;
    className: string;
    data: () => any;
    r: (d: any) => any;
    transform: any;
    clip?: string;
    fill?: (n: any) => any;
    stroke?: (n: any) => any;
    strokeWidth?: (n: any) => any;
}
export declare class NodeLayer implements ILayer {
    view: ILayerView;
    args: NodeLayerArgs;
    d3updatePattern: D3UpdatePattern;
    name: string;
    update: {
        parent: () => void;
        data: () => void;
        transformation: () => any;
        style: () => any;
    };
    constructor(view: ILayerView, args: NodeLayerArgs);
    private attach;
}
