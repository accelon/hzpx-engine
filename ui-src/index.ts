import {bsearchgetter} from 'ptk/utils'
import {Kage} from 'kage-engine'
import {loadFont,getGlyph} from '../src/gwfont.ts'
import {drawGlyph, drawPinx,drawPinxChar} from '../src/drawglyph.ts';
const {gwcomp,cjkbmp,cjkext}=loadFont(GWCOMP,CJKBMP,CJKEXT);
const logger=document.querySelector('#logger')
const button=document.querySelector('#getter')
const glyph=document.querySelector('#glyph')
const glyph2=document.querySelector('#glyph2')
glyph.innerHTML=drawPinx('邏羅寶貝𩀨從䞃致招',{size:200});
console.log(glyph2.title)
glyph2.innerHTML=drawPinx(glyph2.title,{size:200}).join('');
