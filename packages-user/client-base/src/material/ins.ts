import { AutotileProcessor } from './autotile';
import { MaterialManager } from './manager';

export const materials = new MaterialManager();
export const autotile = new AutotileProcessor(materials);
