﻿import {frameOf,getGlyph,ch2gid,loadComponents} from './gwfont.ts'
import {getFontFace,enumFontFace } from './fontface.ts'
import {Kage} from 'kage-engine'
import {splitUTF32,codePointLength} from 'ptk/utils'
import {splitPinx,validIRE} from './pinx.ts'
import {DrawGlyphOptions} from './interfaces.ts';

let pxe = new Kage();
pxe.kUseCurve=true;
let renderedComponents=[];

const resizeSVG=(svg:string,size=64)=>svg.replace(/(width|height)=\"\d+\"/g,(m,m1,m2)=>m1+'='+size);
const patchSVG=(svg:string,patch:string)=>svg.replace(/<svg /,'<svg '+patch+' ');
const patchColor=(svg:string,color:string)=>svg.replace(/fill="black"/g,'fill="'+color+'"');

const setKageOption=(opts:DrawGlyphOptions,engine:Kage)=>{
	engine=engine||pxe;
	const fontface=getFontFace(opts.fontface||'');
	if (fontface) {
		engine.kShotai=fontface.hei?1:0;
		for (let key in fontface) engine.kFont[key]=fontface[key];
	} else {
		engine.kShotai=opts.hei?1:0;
		engine.kFont.kWidth=opts.width||5;		
	}
}
const addFrameToSVG=(gd:string,svg:string)=>{
	const frames=frameOf(gd); 
	let framesvg='';
	for (let i=0;i<frames.length;i++) {
		const [x,y,x2,y2]=frames[i];
		const w=x2-x, h=y2-y;
		const color='hsl('+((i+1)*60) +' ,50%,30%)';		
		framesvg+=`<rect x=${x} y=${y} width=${w} height=${h} 
		 style="fill:none;stroke: ${color} ; stroke-width:${i+1}" ></rect>`;
	}
	return appendToSVG(framesvg,svg);
}
export const  drawGlyph=(unicode: string , opts: DrawGlyphOptions={})=>{
	if (!unicode) return '';
	const components={};
	const size=opts.size||64;
	const alt=opts.alt||false;
	const color=opts.color||'black';
	const frame=opts.frame||false;
	
	let gid;
	let polygons = new Kage.Polygons();

	if (unicode.codePointAt(0)<0x2000) { 
		gid=unicode;
	} else {
		gid='u'+unicode.codePointAt(0).toString(16);
	}

	const d=getGlyph(gid);

	if (!d) return unicode;
	loadComponents(d,components);

	for (let comp in components) {
		pxe.kBuhin.push(comp,components[comp]);
	}
	pxe.kBuhin.push(gid,d);
	renderedComponents.push(...Object.keys(components));
	setKageOption(opts,pxe);
	
	pxe.makeGlyph(polygons, gid);
	let svg=polygons.generateSVG(true);
	svg = opts.frame?addFrameToSVG(d,svg):svg;
	svg = patchSVG(svg, 'style="padding-top:0.2em" gid='+gid+ ' title='+unicode);
	if (color!=='black' && color) svg = patchColor(svg, color);
	return resizeSVG( svg,size);
}
export const drawPinxChar=(ire,opts: DrawGlyphOptions={})=>{
	const chars=splitUTF32(ire);

	if (!(validIRE(ire))) return drawGlyphs(ire);
	let i=0,polygons = new Kage.Polygons();
	const size=opts.size||64;
	let appends=[];
	while (i<chars.length-2) {
		const components={};	
		const d=getGlyph(chars[i]);
		pxe.kBuhin.push(ch2gid(chars[i]),d);
		loadComponents(d,components);

		//const func=Instructions[String.fromCodePoint(chars[i+1])];
		let from,to,append;
		// if (func) {
		// 	[from,to,append]=func(chars.slice(i));
		// 	appends.push(append);
		// } else {
			from = ch2gid(chars[i+1]||'');
			to   = ch2gid(chars[i+2]||'');
		// }
		for (let c in components) {
			if (c.slice(0,from.length)==from) { 
				let repl=getGlyph(to+c.slice(from.length));//same variant
				if (!repl) repl=getGlyph(to); 
				pxe.kBuhin.push(c, repl ) ; //替換，但框不變，  	
				const comps={};
				loadComponents(repl,comps);
				for (let c2 in comps) pxe.kBuhin.push(c2, comps[c2]);
			} else {
				pxe.kBuhin.push(c, components[c]);
			}
		}
		renderedComponents.push(...Object.keys(components));			
		i+=2;
	}
	const d=getGlyph(chars[0]);
	pxe.kBuhin.push(ire,d);
	setKageOption(opts,pxe)
	pxe.makeGlyph(polygons, ire);
	let svg=polygons.generateSVG(true);
	appends.forEach(append=>svg=appendToSVG(append,svg));
	svg = opts.frame?addFrameToSVG(d,svg):svg;
	svg = patchSVG(svg, 'style="padding-top:0.2em" title='+ire);
	if (opts.color!=='black' && opts.color) svg = patchColor(svg, opts.color);
	svg = resizeSVG(svg,size);
	return svg;
}
export const drawPinx=(str:string,opts: DrawGlyphOptions={})=>{
	pxe = new Kage();
	pxe.kUseCurve = true;
	renderedComponents=[];
    const units=splitPinx(str,true); // char not in glyph database will be expanded automatically
    const out=[]
    for (let i=0;i<units.length;i++) {
    	const u=units[i];
    	out.push( (codePointLength(u)==1? (drawGlyph(u,opts)): (drawPinxChar(u,opts))))
    }
	return out;
}
