import { createMainController } from './controller';

export function createUI() {
    createMainController();
}

export * from './controller';
export * from './main';
export * from './save';
export * from './settings';
export * from './statusBar';
export * from './toolbar';
export * from './viewmap';
