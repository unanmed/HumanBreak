import { ComponentOptions, EmitsOptions, SlotsType } from 'vue';

export type SetupComponentOptions<
    Props extends Record<string, any>,
    E extends EmitsOptions = {},
    EE extends string = string,
    S extends SlotsType = {}
> = Pick<ComponentOptions, 'name' | 'inheritAttrs'> & {
    props?: (keyof Props)[];
    emits?: E | EE[];
    slots?: S;
};
