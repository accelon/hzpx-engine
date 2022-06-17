import {CJKRangeName,splitUTF32Char} from 'ptk/utils'

const inRange=(s:string,cjkranges:string[] )=>{
	const rangename=CJKRangeName(s);
	return ~cjkranges.indexOf(rangename);
}
const replaceReg=/\07([^\07]+)\07/g

export const extractReplacable=(html,opts={}) =>{
	const pair=opts.pair||'︻︼';
	const cjkranges=(opts.cjk||'CDEFG').toUpperCase().split('').map(s=>'Ext'+s); //match the CJKRangeName

	let out='', nreplace=0;
	const toReplace=[];  // keep the parameters for drawPinx, array index is \07idx\07 svg insert point

	const getReplaceId=(s:string):number=>{
		const at=toReplace.indexOf(s);
		if (at==-1) {
			toReplace.push(s);
			return toReplace.length-1;
		}
		return at;
	}
	html=html.replace(/([\ud800-\udfff]{2})/g,function(m,sur){ //extract replaceble CJK Extension
		if (inRange(sur,cjkranges)) {
			const id=getReplaceId(sur);
			return String.fromCharCode(7) + id.toString() +String.fromCharCode(7) ;
		} else {
			return sur;
		}
	})
	if (pair && pair.length==2) { //as finding Pinx is slow, user need to specify a enclosing pattern
		const [left,right]=splitUTF32Char(pair)
		const reg=new RegExp(left+'([^'+right+']+)'+right,'g');
		html=html.replace(reg, (m,m1)=>{
			const id=getReplaceId(m1);
			return String.fromCharCode(7) + id.toString() +String.fromCharCode(7) ;
		});
	}
	return [html,toReplace];
}

// this is a naive implementation, assuming ele has fix style
export const inject=(ele:HTMLElement,opts={})=>{
	if (!onOff) return;
	const {color ,fontSize}=window.getComputedStyle(ele); 
	const size=parseInt(fontSize)*1.1;
	const [text,replaces]=extractReplacable(ele.innerHTML,opts);
	ele.innerHTML=text.replace(replaceReg,(m,id)=>drawPinx(replaces[parseInt(id)],{color,size}));
}

export const injectByServiceWorker=async (ele:HTMLElement,opts={})=>{
	const {color ,fontSize}=window.getComputedStyle(ele);
	const [text,replaces]=extractReplacable(ele.innerHTML,opts);
	const svgs=await chrome.runtime.sendMessage({data:replaces});
	html.innerHTML=text.replace(replaceReg,(m,id)=>svgs[parseInt(id)]);
}
export const render=(ele:HTMLElement, text=''):void=>{
	if (!ele) return;
	if (!onOff) return ele.innerText;
	if (!text) text=ele.innerText;
	const {color ,fontSize}=window.getComputedStyle(ele);
	const size= parseInt(fontSize);
	ele.innerHTML=drawPinx(text,{color,size}).join('');
	return ele.innerText;
}

import {loadFont,addFontData,isFontReady} from './src/gwfont.ts'
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
export const onoff=(_onoff:boolean)=>onOff=_onoff;

export const Hzpx={addFontData,ready,drawPinx,loadFont, inject, render , onoff};

if (typeof window!=='undefined' && !window.Hzpx) window.Hzpx=Hzpx;

export default Hzpx;