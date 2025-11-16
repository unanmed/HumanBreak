import { LayerState } from './layerState';
import { ICoreState, ILayerState } from './types';

export class CoreState implements ICoreState {
    readonly layer: ILayerState;

    constructor() {
        this.layer = new LayerState();
    }
}
