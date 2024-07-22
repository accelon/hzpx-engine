import {bsearchNumber,bsearch, codePointLength,splitUTF32Char,alphabetically0,loadRawText} from './ptkutils.ts'
import {unpackGD} from './gwpacker.ts';

let ptk ;
let gidarr=[]; // bsearchable gid off components, all parts including bmp,ext
let bmp_starts,ext_starts,gwcomp_starts,ebag_starts;
let ptkfont=false;
let cjkbmp,cjkext;

let gwgid=[]; // 從 gwcomp 拆出的 gid , 不含bmp,ext
let gwbody=[];  //  組字指令，可能全部(從glyphwiki-dump.txt 載入時)，或不含bmp/ext (從browser 載入時)
let rawlines;

export const addFontData=(name,data)=>{ //call by pure js data cjkbmp.js 
	if (name=='cjkbmp') cjkbmp=data.split(/\r?\n/);
	else if (name=='cjkext') cjkext=data.split(/\r?\n/);
	else if (name=='gwcomp') {
		const comps=[];
		const lines=data.split(/\r?\n/);
		for (let i=0;i<lines.length;i++) {
			const line=lines[i]
			const at=line.indexOf(',');
			comps.push([line.slice(0,at),line.slice(at+1)]);
		}
		comps.sort(alphabetically0);
		for (let i=0;i<comps.length;i++) {
			gwgid.push(comps[i][0]);
			gwbody.push(comps[i][1]);
		}
	}
}

export const setFontPtk=(_ptk,g,gw,b,e,ebag)=>{
	ptk=_ptk
	gidarr=g;
	bmp_starts=b;
	ext_starts=e;
	gwcomp_starts=gw;
	ebag_starts=ebag;
	ptkfont=true;
}
export const setFontTSV=(raw)=>{
	rawlines=loadRawText(raw);
	const comps=[];
	for (let i=0;i<rawlines.length;i++) {
		const line=rawlines[i];
		const at=line.indexOf('\t');
		const unicode=line.slice(0,at);
		const body=line.slice(at+1);
		comps.push([unicode, body])
	}
	comps.sort(alphabetically0);
	for (let i=0;i<comps.length;i++) {
		gidarr.push(comps[i][0]);
		gwbody.push(comps[i][1])
	}

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
		gwgid.push(comps[i][0]);
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
export const ch2gid=(ch)=>'u'+(typeof ch=='number'?ch:(ch.codePointAt(0)||' ')).toString(16);
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
	let data='';
	const gid=getGID(s);
	if (rawlines) {
		const at= bsearch(gidarr,gid);
		if (at>0 && gidarr[at].startsWith(gid)) { //make sure same base codepoint otherwise cannot match u21a67-03
			data=gwbody[at]
		}
		return data;
	}
	if (ptkfont) return getGlyphPtk(s);

	const m=gid.match(/^u([\da-f]{4,5})$/);
	if (m) {
		const cp=parseInt(m[1],16);
		if (cp>=0x20000 && cp<=0x40000) {
            data=cjkext[cp-0x20000];
		} else if (cp>=0x3400 && cp<0x9FFF) {
            data=cjkbmp[cp-0x3400];
        }
    } else {
		const at= bsearch(gwgid,gid);
		if (~at && gid.startsWith(gwgid[at])) {
			data=gwbody[at];
			
		}
    }
	const r=unpackGD(data);
	return r
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
		const units=entries[i].split(':');
		if (units[0]=='99') {
			let gid=units[7];
			if (gid=='undefined') {
				console.log('wrong gid')
				break;
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
export const isDataReady=()=>{
	const ready= cjkbmp && cjkbmp.length && cjkext && cjkext.length && gwbody && gwbody.length;
	console.log('ready',ready)
	return ready;
}


