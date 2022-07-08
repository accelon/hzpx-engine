import {StringArray,bsearch,codePointLength,splitUTF32Char,LineBase,unpackStrings} from 'ptk'
import {unpackGD} from './gwpacker.ts';
import {Frame} from './interfaces.ts';

let cjkbmp:StringArray;
let cjkext:StringArray;
let gwcompvalues:StringArray;
let gwcompkeys:StringArray;
let lbase ;
let gidarr=[] // bsearchable gid off components
let bmp_starts,ext_starts,gwcomp_starts;

export const getGID=(id:string|number):string=>{ //replace versioning , allow code point or unicode char
	let r='';
	if (typeof id==='number') return ch2gid(id);
	else if (typeof id=='string') {
		if ( (id.codePointAt(0)||0) >0x2000) {
			id='u'+(id.codePointAt(0)||0).toString(16);
		}
		return id.replace(/@\d+$/,''); // no versioning (@) in the key
	}
	return '';
}
export const ch2gid=(ch:string|number)=>'u'+(typeof ch=='number'?ch:(ch?.codePointAt(0)||' ')).toString(16);
export const getGlyph=(s:string|number)=>{
	if (typeof s=='number') s=String.fromCodePoint(s)
	if (!s||( typeof s=='string' && (s.codePointAt(0)||0)>0xff && codePointLength(s)>1)) {
		return ''; //is an ire
	}
	let lbaseline;
	const gid=getGID(s);
	const m=gid.match(/^u([\da-f]{4,5})$/);
	if (m) {
		const cp=parseInt(m[1],16);
		if (cp>=0x20000) {
			lbaseline=ext_starts+cp-0x20000 ;
		} else if (cp>=0x3400 && cp<0x9FFF) {
			lbaseline=bmp_starts+cp-0x3400  ;
		}
	} else {
		const at=bsearch(gidarr,gid);
		if (gid==gidarr[at]) {
			lbaseline=gwcomp_starts+at;
		} else {
			return;
		}
	}
	if (typeof lbaseline=='undefined') return;

	//assuming all read are loaded, recursive await is very slow
	const gd=lbase.slice(lbaseline)[0];
	
	return unpackGD(gd);
}
let depth=0;
export const loadComponents=(data,compObj,countrefer=false)=>{ //enumcomponents recursively
	const entries=data.split('$');
	depth++;
	if (depth>10) {
		console.log('too deep fetching',data); //this occur only when glyphwiki data is not in order.
		return;
	}
	for (let i=0;i<entries.length;i++) {
		if (entries[i].slice(0,3)=='99:') {
			let gid=entries[i].slice(entries[i].lastIndexOf(':')+1);
			if (parseInt(gid).toString()==gid) { //部件碼後面帶數字
				gid=(entries[i].split(':')[7]).replace(/@\d+$/,'');
			}
			const d=getGlyph(gid);
			if (!d) {
				console.log('glyph not found',gid);
			} else {
				if (countrefer) {
					if (!compObj[gid])compObj[gid]=0;
					compObj[gid]++;					
				} else {
					if (!compObj[gid])compObj[gid]= getGlyph(gid)
				}
				loadComponents(d,compObj,countrefer);
			}
		}
	}
	depth--;
}
export function frameOf(gd:string, rawframe:string=''):Frame[] {
	const entries=gd.split('$');
	let frames=[];
	let gid='';
	for (let i=0;i<entries.length;i++) {
		if (entries[i].slice(0,3)==='99:') {
			const [m,a1,a2,x1,y1,x2,y2,id]=entries[i].split(':');
			const f:Frame=[parseInt(x1),parseInt(y1),parseInt(x2),parseInt(y2)];
			frames.push(f);
			gid=id;
		}
	}
	if (!rawframe && frames.length==1) { //自動全框展開
		frames=frameOf(getGlyph(gid));
	}
	return frames;
}

export const gid2ch=(gid:string)=> {
	if (gid[0]!=='u') return ' ';
	let n=parseInt(gid.slice(1) ,16)
	if (n<0x20 ||isNaN(n)) n=0x20;
	return String.fromCodePoint(n);
}
export const serializeGlyphUnit=(glyphunits:string)=>glyphunits.map(it=>it.join(':')).join('$');
export const deserializeGlyphUnit=(glyphdata:string)=>glyphdata.split('$').filter(it=>it!=='0:0:0:0').map(item=>item.split(':'));

export const factorsOfGD=(gd:string,gid:string)=>{
	const units=deserializeGlyphUnit(gd);
	let factors=[];
	if (units.length==1 && units[0][0]==='99') { //full frame char , dig in 
		const compid=units[0][7];
		return factorsOfGD(getGlyph(compid),compid);
	}
	for (let i=0;i<units.length;i++) {
		if (units[i][0]==='99') {
			factors.push(units[i][7]);
		}
	}
	return gid?factors:factors.map(gid2ch).join('');
}
export const componentsOf=(ch,returnid=false)=>{
	const d=getGlyph(ch);
	return (componentsOfGD(d,returnid)).filter(it=>it!==ch);
}
export const componentsOfGD=(d:string,returnid=false)=>{
	const comps={};
	loadComponents(d,comps);
	const out=Object.keys(comps);
	return returnid?out:out.map( gid2ch );
}
export const getLastComps=(value:string)=>{
	if (!value) return [];
	const chars=splitUTF32Char(value);
	if (!chars.length) return [];
	return componentsOf(chars[chars.length-1]);
}
/*
export const addFontData=(key:string,data:string)=>{
	if (key=='gwcomp') gwcomp=new StringArray(data,'=');//component gid as key
	else if (key=='cjkbmp') cjkbmp=new StringArray(data); // array index = codepoint - 0x3400
	else if (key=='cjkext') cjkext=new StringArray(data); // array index = codepoint - 0x2000 
	else throw "wrong font key";
}
*/
//
/*
export const loadJsFont=(comp:string,bmp:string,ext:string)=>{
	addFontData('gwcomp',comp);
	addFontData('cjkbmp',bmp);
	addFontData('cjkext',ext);
  return {gwcomp,cjkbmp,cjkext};    // client should not access the StringArray directly
}
*/
export const isFontReady=()=>!!lbase;
export const loadFont=async (zip)=>{ //see hzpx/pack-glyphwiki.js
	if (lbase) return lbase;	
	console.time('loadfont')
	lbase=new LineBase({name:"hzpx",zip});
	await lbase.isReady();
	gwcomp_starts=lbase.sectionRange('gwcomp')[0];
	bmp_starts=lbase.sectionRange('bmp')[0];
	let ends;//ends of glyphwiki data
	[ext_starts,ends]=lbase.sectionRange('ext');
	// await lbase.loadLines(lbase.sectionRange('gid')  );
	await lbase.loadLines(0, ends); // recursive await is very slow 

	const packedstrings=lbase.slice(0,1)[0];
	gidarr=unpackStrings(packedstrings);

	//console.log(gwcomp_starts,bmp_starts,ext_starts);
	console.timeEnd('loadfont')
	return lbase;
}
