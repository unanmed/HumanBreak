export interface RequiredData {
    main: {
        floorIds: string[];
        images: string[];
        tilesets: string[];
        animates: string[];
        bgms: string[];
        sounds: string[];
        fonts: string[];
    };
    firstData: {
        name: string;
    };
}

export interface RequiredIconsData {
    autotile: {
        [x: string]: number;
    };
}

export type ResourceUsage =
    | 'image'
    | 'tileset'
    | 'animate'
    | 'sound'
    | 'font'
    | 'autotile'
    | 'material';

export type ResourceType =
    | 'text'
    | 'buffer'
    | 'image'
    | 'material'
    | 'audio'
    | 'json'
    | 'zip'
    | 'byte';
