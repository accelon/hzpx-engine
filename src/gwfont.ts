import {StringArray,codePointLength} from 'ptk/utils'
import {unpackGD} from './gwpacker.ts';
import {Frame} from './interfaces.ts';
let cjkbmp:StringArray;
let cjkext:StringArray;
let gwcomp:StringArray; 
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
	const gid=getGID(s);
	const m=gid.match(/^u([\da-f]{4,5})$/);
	if (m) {
		const cp=parseInt(m[1],16);
		if (cp>=0x20000) {
			const gd=cjkext.get( cp-0x20000 +1 );
			return unpackGD(gd);
		} else if (cp>=0x3400 && cp<0x9FFF) {
			const gd=cjkbmp.get( cp-0x3400 + 1 );
			return unpackGD(gd);
		}
	}
	return unpackGD(gwcomp.getValue(gid));
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
export const loadFont=(comp:string,bmp:string,ext:string)=>{
  gwcomp=new StringArray(comp,'='); //component gid as key
  cjkbmp=new StringArray(bmp);      // array index = codepoint - 0x3400
  cjkext=new StringArray(ext);      // array index = codepoint - 0x2000 
  return {gwcomp,cjkbmp,cjkext};    // client should not access the StringArray directly
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
	return componentsOfGD(d,returnid).filter(it=>it!==ch);
}
export const componentsOfGD=(d:string,returnid=false)=>{
	const comps={};
	loadComponents(d,comps);
	const out=Object.keys(comps);
	return returnid?out:out.map( gid2ch );
}