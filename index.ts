import {LEMMA_DELIMITER,StringArray,openPtk,CJKRangeName,splitUTF32Char} from 'ptk'
export * from './src/fontface.ts'
export * from './src/pinx.ts'
const inRange=(s,cjkranges )=>{
	const rangename=CJKRangeName(s);
	return ~cjkranges.indexOf(rangename);
}
const replaceReg=/\07([^\07]+)\07/g

export const extractPinx=(html,opts={}) =>{
	const pair=opts.pair||'︻︼';
	const cjk=opts.cjk||'ABCDEFGHZ';
	const cjkranges=cjk.toUpperCase().split('').map(s=>'Ext'+s); //match the CJKRangeName

	let out='', nreplace=0;
	const Pinx=[];  // keep the parameters for drawPinx, array index is \07idx\07 svg insert point

	const getReplaceId=(s)=>{
		const at=Pinx.indexOf(s);
		if (at==-1) {
			Pinx.push(s);
			return Pinx.length-1;
		}
		return at;
	}
	if (pair && pair.length==2) { //as finding Pinx is slow, user need to specify a enclosing pattern
		const [left,right]=splitUTF32Char(pair)
		const reg=new RegExp(left+'([^'+right+']+)'+right,'g');
		html=html.replace(reg, (m,m1)=>{
			const id=getReplaceId(m1);
			return String.fromCharCode(7) + id.toString() +String.fromCharCode(7) ;
		});
	}
	html=html.replace(/([\ud800-\udfff]{2})/g,function(m,sur){ //extract replaceble CJK Extension
		if (inRange(sur,cjkranges)) {
			const id=getReplaceId(sur);
			return String.fromCharCode(7) + id.toString() +String.fromCharCode(7) ;
		} else {
			return sur;
		}
	})
	return [html,Pinx];
}

// this is a naive implementation, assuming ele has fix style
export const injectPinx=(ele,opts={})=>{
	if (!onOff) return;
	const {color ,fontSize}=window.getComputedStyle(ele); 
	const size=parseInt(fontSize)*1.1;
	const [text,replaces]=extractPinx(ele.innerHTML,opts);
	ele.innerHTML=text.replace(replaceReg,(m,id)=>drawPinx(replaces[parseInt(id)],{color,size}));
}


export const renderPinx=(ele, text='')=>{
	if (!ele) return;
	if (!onOff) return ele.innerText;
	if (!text) text=ele.innerText;
	const {color ,fontSize}=window.getComputedStyle(ele);
	const size= parseInt(fontSize);
	ele.innerHTML=drawPinx(text,{color,size}).join('');
	return ele.innerText;
}

import {isFontReady,getLastComps, setFontPtk} from './src/gwfont.ts'
export const loadFont= async ()=>{
	const ptk=await openPtk('hzpx')
	await ptk.loadAll(); // recursive await is very slow 
	const [gid_starts]=ptk.sectionRange('gid');
	const gidarr=new StringArray(ptk.getLine(gid_starts), {sep:LEMMA_DELIMITER});
	const [bmp_starts]=ptk.sectionRange('bmp');
	const [ext_starts]=ptk.sectionRange('ext');
	const [gwcomp_starts]=ptk.sectionRange('gwcomp');	
	//const [ebag_starts]=ptk.sectionRange('ebag');
	setFontPtk(gidarr,gwcomp_starts[0],bmp_starts[0],ext_starts[0])
}


import {drawPinx} from './src/drawglyph.ts'
export const ready=()=>{
	return new Promise(resolve=>{
		let timer1=setInterval(()=>{
			if (isFontReady()) {
				clearInterval(timer1);
				resolve();
			}
		},100);
	});
}
let onOff=true;
export const renderSelector=(selector='.hzpx')=>{
	const eles=document.querySelectorAll(selector);
	eles.forEach(ele=>Hzpx.injectPinx(ele))
}
export const Hzpx={ready,isFontReady, drawPinx,loadFont, injectPinx, renderPinx,getLastComps};

if (typeof window!=='undefined' && !window.Hzpx) {
	window.Hzpx=Hzpx;

}
if (typeof window!=='undefined') {
	setTimeout(async ()=>{
		await Hzpx.ready();
		if (typeof document=='undefined') return;
		document.body.attributes['hzpx']=true;//tell extension not to render again
		renderSelector();
	},1);	
}


export {drawPinx, isFontReady,loadFont, getLastComps};
export default Hzpx;