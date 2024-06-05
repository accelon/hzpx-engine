import {bsearchNumber, codePointLength,splitUTF32Char,alphabetically0} from './ptkutils.ts'
import {unpackGD} from './gwpacker.ts';
let ptk ;
let gidarr; // bsearchable gid off components
let bmp_starts,ext_starts,gwcomp_starts,ebag_starts;
let ptkfont=false;
let cjkbmp,cjkext;

let gwunicode=[], gwbody=[];  //部件 內碼及本體，排序過


export const setFontPtk=(g,gw,b,e,ebag)=>{
	gidarr=g;
	bmp_starts=b;
	ext_starts=e;
	gwcomp_starts=gw;
	ebag_starts=ebag;
	ptkfont=true;
}
export const setFontJs=(gw,bmp,ext)=>{
	cjkbmp=bmp;  //start from U+3400
	cjkext=ext;  //starts from U+20000	
	const comps=[];
	for (let i=0;i<gw.length;i++) {
		const line=gw[i];
		const at=line.indexOf(',');
		const unicode=parseInt(line.slice(1,at),16);
		const body=line.slice(at+1);
		comps.push([unicode, body])
	}
	comps.sort(alphabetically0);
	for (let i=0;i<comps.length;i++) {
		gwunicode.push(comps[i][0]);
		gwbody.push(comps[i][1])
	}
}
export const getGID=(id)=>{ //replace versioning , allow code point or unicode char
	let r='';
	if (typeof id==='number') return ch2gid(id);
	else if (typeof id=='string') {
		if ( (id.codePointAt(0)||0) >0x2000) {
			id='u'+(id.codePointAt(0)||0).toString(16);
		}
		return id;//.replace(/@\d+$/,''); // no versioning (@) in the key
	}
	return '';
}
export const ch2gid=(ch)=>'u'+(typeof ch=='number'?ch:(ch?.codePointAt(0)||' ')).toString(16);
const getGlyphPtk=(s)=>{
	if (typeof s=='number') s=String.fromCodePoint(s)
	if (!s||( typeof s=='string' && (s.codePointAt(0)||0)>0xff && codePointLength(s)>1)) {
		return ''; //is an ire
	}
	let lbaseline;
	const gid=getGID(s);
	const m=gid.match(/^u([\da-f]{4,5})$/);
	if (m) {
		const cp=parseInt(m[1],16);
		if (cp>=0x20000 && cp<=0x40000) {
			lbaseline=ext_starts+cp-0x20000 ;
		} else if (cp>=0x3400 && cp<0x9FFF) {
			lbaseline=bmp_starts+cp-0x3400  ;
		} else if (cp>=0xa0000 && cp<=0xd4fff) {
			lbaseline=ebag_starts+cp-0xa0000  ;
		}
	} else {
		// const at=bsearch(gidarr,gid);
		const at=gidarr.find(gid);

		if (gid==gidarr.get(at)) {
			lbaseline=gwcomp_starts+at;
		} else {
			return;
		}
	}
	if (typeof lbaseline=='undefined') return;

	//assuming all read are loaded, recursive await is very slow
	if (!ptk) return '';
	const gd=ptk.getLine(lbaseline);
	
	return unpackGD(gd);
}
export const getGlyph=s=>{
	if (ptkfont) return getGlyphPtk(s);
	const gid=getGID(s);
	const m=gid.match(/^u([\da-f]{4,5})$/);
	let data='';
	if (m) {
		const cp=parseInt(m[1],16);
		if (cp>=0x20000 && cp<=0x40000) {
            data=cjkext[cp-0x20000];
		} else if (cp>=0x3400 && cp<0x9FFF) {
            data=cjkbmp[cp-0x3400];
        }
    } else {
		const at= bsearchNumber(gidarr,gid);
		if (~at) {
			data=gwbody[at];
		}
    }
	return unpackGD(data)
};


let depth=0;
export const loadComponents=(data,compObj,countrefer=false)=>{ //enumcomponents recursively
	if (!data) return;
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
				gid=(entries[i].split(':')[7]);//.replace(/@\d+$/,'');
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
export function frameOf(gd, rawframe='') {
	const entries=gd.split('$');
	let frames=[];
	let gid='';
	for (let i=0;i<entries.length;i++) {
		if (entries[i].slice(0,3)==='99:') {
			const [m,a1,a2,x1,y1,x2,y2,id]=entries[i].split(':');
			const f=[parseInt(x1),parseInt(y1),parseInt(x2),parseInt(y2)];
			frames.push(f);
			gid=id;
		}
	}
	if (!rawframe && frames.length==1) { //自動全框展開
		frames=frameOf(getGlyph(gid));
	}
	return frames;
}

export const gid2ch=(gid)=> {
	if (gid[0]!=='u') return ' ';
	let n=parseInt(gid.slice(1) ,16)
	if (n<0x20 ||isNaN(n)) n=0x20;
	return String.fromCodePoint(n);
}
export const serializeGlyphUnit=(glyphunits)=>glyphunits.map(it=>it.join(':')).join('$');
export const deserializeGlyphUnit=(glyphdata)=>glyphdata.split('$').filter(it=>it!=='0:0:0:0').map(item=>item.split(':'));

export const factorsOfGD=(gd,gid)=>{
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
export const componentsOfGD=(d,returnid=false)=>{
	const comps={};
	loadComponents(d,comps);
	const out=Object.keys(comps);
	return returnid?out:out.map( gid2ch );
}
export const getLastComps=(value)=>{
	if (!value) return [];
	const chars=splitUTF32Char(value);
	if (!chars.length) return [];
	return componentsOf(chars[chars.length-1]);
}
export const isFontReady=()=>!!ptk;

