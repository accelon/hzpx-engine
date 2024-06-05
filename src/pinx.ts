import {getGlyph,componentsOf, factorsOfGD} from './gwfont.ts'
import {splitUTF32Char,codePointLength,intersect} from "./ptkutils.ts"

export const autoPinx=(ch,base)=>{
	if (ch==base || !base) return ''
	const f1=factorsOfGD( getGlyph(ch), true);
	const f2=factorsOfGD( (getGlyph(base))).map(it=> UnifiedComps_UTF32[it]||it );
	// if (ch==='䭙') console.log(f1,f2.map(it=>String.fromCodePoint(it)),ch,base)
	const commonpart=intersect(f1,f2);
	const from=f2.filter(it=>commonpart.indexOf(it)==-1);
	const to=f1.filter(it=>commonpart.indexOf(it)==-1);

	if (from.length===1 && to.length===1) {
		return base+String.fromCodePoint(from)+String.fromCodePoint(to);
	}
	return ''
}
export const splitPinx=(str, tryAutoIRE=false)=>{
	const out=[];
	const chars=splitUTF32Char(str);
	let i=0;
	let nesting=0 ,ire='';  
	while (i<chars.length) {
		const gid=str;
		nesting&&nesting--;
		const comps=componentsOf(chars[i]);
		if (~comps.indexOf( chars[i+1] ) ){//|| Instructions[chars[i+1]]) {
			ire += chars[i]+chars[i+1];
			nesting++;
			i++;
		} else {
			if (nesting) {
				ire+=chars[i];
			} else {
				if (ire) {
					out.push(ire+chars[i]);	
					ire='';
				} else {
					let ch=chars[i];
					if (tryAutoIRE&&!getGlyph(ch)) { //not found, try to replace with ire
						ch=autoPinx(ch) || ch;
					}
					out.push(ch)
				}
			}
		}
		i++;
	}
	ire&&out.push(ire)
	return out;
}
export const validIRE=(iretring)=>codePointLength(ire)>1 && (splitPinx(ire)).length==1;
