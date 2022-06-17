export interface DrawGlyphOptions {
  size?: number;
  color?:string;
  frame?:boolean;
  alt?:boolean;
  fontface?:string;
  hei?:boolean;
}

export interface FontFace {

	kMinWidthY?:number;
	kMinWidthU?:number;
	kMinWidthT?:number;
	kWidth?:number;
	kShotai?:number;
}

export interface FontFaceMap {
  [key: string]: FontFace
}

export type Frame = [ x:number,y:number,w:number,h:number];