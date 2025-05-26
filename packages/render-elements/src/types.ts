export type SizedCanvasImageSource = Exclude<
    CanvasImageSource,
    VideoFrame | SVGElement
>;

export type CanvasStyle = string | CanvasGradient | CanvasPattern;
