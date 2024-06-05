import {bsearch} from './ptkutils.ts'
let gw= typeof window!=='undefined' && window.BMP;
let _cjkbmp= typeof window!=='undefined' && window.CJKBMP;
let _cjkext= typeof window!=='undefined' && window.CJKEXT;
let _gwcomp= typeof window!=='undefined' && window.GWCOMP;
let getGlyph;

export const serializeGlyphUnit=glyphunits=>glyphunits.map(it=>it.join(':')).join('$');
export const deserializeGlyphUnit=glyphdata=>glyphdata.split('$').filter(it=>it!=='0:0:0:0').map(item=>item.split(':'));

export const eachGlyph=cb=>{
	if (_cjkbmp) {
		for (let i=0;i<_cjkbmp.length;i++) cb('u'+(i+0x3400).toString(16), unpackGD(_cjkbmp[i]));
		for (let i=0;i<_cjkext.length;i++) cb('u'+(i+0x20000).toString(16), unpackGD(_cjkext[i]));
	} else {
		for (let i=0;i<gw.length;i++) {
			if (getGlyph==getGlyph_wiki) {
				const gid=gw[i].slice(0,72).trim();
				const data=gw[i].slice(84);
				cb(gid,data);			
			} else {
				const at=gw[i].indexOf('=');
				cb( gw[i].slice(0,at),gw[i].slice(at+1));
			}
		}		
	}
}
export const eachGlyphUnit=cb=>{
	eachGlyph((gid,data)=>{
		const units=data.split('$');
		const arr=units.map(u=>u.split(':'));
		cb(gid,arr);
	})
}
const getGID=id=>{ //replace versioning , allow code point or unicode char
	let r='';
	if (typeof id=='number') id=ch2gid(id);
	else if (id.codePointAt(0)>0x2000) {
		id='u'+id.codePointAt(0).toString(16);
	}
	return id.replace(/@\d+$/,''); // no versioning (@) in the key
}
export const setGlyph_lexicon=(s,data)=>{ //replace the glyph data
	const gid=getGID(s);
	const at=bsearch(gw,gid+'=',true);
	if (at>0) {
		let from=gw[at].indexOf('=');
		gw[at]=gw[at].slice(0,from+1)+data;
	} else {
		console.log('cannot set glyph',s)
	}
}
export const getGlyph_lexicon=(s,lexicon=gw)=>{
	const gid=getGID(s);
	const at=bsearch(lexicon,gid+'=',true);
	let r='';
	if (at>=0  && (lexicon[at].slice(0,gid.length+1)==gid+'=')) {
		const from=lexicon[at].indexOf('=');
		r=lexicon[at].slice(from+1);
	}
	return r;
}
export const getGlyphWikiData=()=>gw;
export const gidIsCJK=s=>s.match(/^u([\da-f]{4,5})$/);
export const getGlyph_wiki=gid=>{ //get from raw wiki format
	if (gid[0]!==' ') gid=' '+gid;//first char is always ' '
	if (~gid.indexOf('@')) {
		gid=gid.replace(/@\d+$/,'');
	}
	const at=bsearch(gw,gid,true); //try to reuse getGlyph_js

	if (at<1) {
		// console.log('not found',gid)
		return '';
	}
	if (gw[at].slice(0,gid.length+1)!==gid+' ') {
		// console.log('not found2',gid,gw[at])
		return '';
	}
	return gw[at].slice(84);
}
export const prepareForNodejs=(bmp)=>{
	let at=bmp[0].indexOf('`');
	if (~at) bmp[0]=bmp[0].slice(at+1);
	at=bmp[bmp.length-1].indexOf('`');
	if (~at) bmp[bmp.length-1]=bmp[bmp.length-1].slice(0,at);
	if (!bmp[0]) bmp.shift();
	if (!bmp[bmp.length-1]) bmp.pop();
	gw=bmp;
	// if (_basing)basing=_basing.sort(alphabetically);
	// buildDerivedIndex();
}
