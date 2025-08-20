interface Window {
    global: {
        mix: number;
        context: CanvasRenderingContext2D;
        canvas: HTMLCanvasElement;
        width: number;
        height: number;
        percent: number;
        spRender?: spine.canvas.SkeletonRenderer;
        metadata: {
            roles: Array;
        };
        spine: {
            roleScale: number;
        };
        stash: {
            roles: any;
        };
    };
}
