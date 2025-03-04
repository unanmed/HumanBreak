import { ERenderItemEvent } from '@motajs/render-core';
import { TagDefine } from './elements';
import { BaseProps } from './props';

export type DefaultProps<
    P extends BaseProps = BaseProps,
    E extends ERenderItemEvent = ERenderItemEvent
> = TagDefine<P, E>;

export * from './elements';
export * from './map';
export * from './props';
export * from './renderer';
export * from './use';
