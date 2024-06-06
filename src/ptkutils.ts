
export const splitUTF32Char=(str)=>splitUTF32(str).map( cp=>String.fromCodePoint(cp));
export const codePointLength=(str)=>splitUTF32(str).length;
export const splitUTF32=(str)=>{
    if (!str) {
        const empty=[];
        return empty
    }
    let i=0;
    const out=[];
    while (i<str.length) {
        const code=str.codePointAt(i)||0;
        out.push(code);
        i++;
        if (code>0xffff) i++;
    }
    return out;
}
export const maxlen1=113
export const maxlen2=113*113	   //12769
export const maxlen3=113*113*113 //1442897

export const CodeStart=0x0E;
export const BYTE_MAX=113;
export const BYTE1_MAX=45                                       //delta
export const BYTE2_MAX=44*BYTE_MAX+BYTE1_MAX                     //5017      //for year bc 2000~ad2280
export const BYTE2_START=45;    
export const BYTE3_START=89;         
export const BYTE4_START=105;         
export const BYTE5_START=112;
export const BYTE3_MAX=16*BYTE_MAX*BYTE_MAX+BYTE2_MAX                     // ~204304     
export const BYTE4_MAX=6 *BYTE_MAX*BYTE_MAX*BYTE_MAX+BYTE3_MAX            // ~10100279   
export const BYTE5_MAX=2 *BYTE_MAX*BYTE_MAX*BYTE_MAX*BYTE_MAX+BYTE4_MAX  // 326094722
export const SEP2DITEM=0x7f
export const SEPARATOR2D="\u007f"

export const packInt=(arr ,delta=false)=>{
	if (arr.length==0) return '';
	const sz=arr.length*5;  
	let s=new Uint8Array(sz), int=arr[0]+1, prev=arr[0] , idx=0;

	for (let i=1;i<=arr.length;i++) {
		if (isNaN(int)) new Error('not an integer at'+i);
		if (int<0) new Error('negative value at'+i+' value'+int);
		if (int<BYTE1_MAX) {			
			s[idx++]=int+CodeStart;
		} else if (int<BYTE2_MAX) {
			int-=BYTE1_MAX;
			let i1,i2;
			i1=int % BYTE_MAX;
			i2=Math.floor(int/BYTE_MAX);
			s[idx++]=i2+BYTE2_START+CodeStart
			s[idx++]=i1+CodeStart;
		} else if (int<BYTE3_MAX) {
			int-=BYTE2_MAX;
			let i1,i2,i3;
			i1=int % BYTE_MAX;
			int=Math.floor(int/BYTE_MAX);
			i2=int % BYTE_MAX
			i3=Math.floor(int/BYTE_MAX);
			s[idx++]=i3+BYTE3_START+CodeStart;
			s[idx++]=i2+CodeStart;
			s[idx++]=i1+CodeStart;
		} else if (int<BYTE4_MAX) {
			int-=BYTE3_MAX;
			let i1,i2,i3,i4;
			i1=int % BYTE_MAX;
			int=Math.floor(int/BYTE_MAX);
			i2=int % BYTE_MAX
			int=Math.floor(int/BYTE_MAX);
			i3=int % BYTE_MAX

			i4=Math.floor(int/BYTE_MAX);
			s[idx++]=i4+BYTE4_START+CodeStart;
			s[idx++]=i3+CodeStart;
			s[idx++]=i2+CodeStart;
			s[idx++]=i1+CodeStart;
		} else if (int<BYTE5_MAX) {
			int-=BYTE4_MAX;
			let i1,i2,i3,i4,i5;
			i1=int % BYTE_MAX;
			int=Math.floor(int/BYTE_MAX);
			i2=int % BYTE_MAX
			int=Math.floor(int/BYTE_MAX);
			i3=int % BYTE_MAX
			int=Math.floor(int/BYTE_MAX);
			i4=int % BYTE_MAX

			i5=Math.floor(int/BYTE_MAX);
			s[idx++]=i5+BYTE5_START+CodeStart;
			s[idx++]=i4+CodeStart;
			s[idx++]=i3+CodeStart;
			s[idx++]=i2+CodeStart;
			s[idx++]=i1+CodeStart;
		} else {
			// console.log(arr)
			// console.log('neighbor of arr',i,delta,arr.slice(i,10),arr.length, prev)
			throw new Error('exist max int boundary '+BYTE5_MAX+ ' i'+i+',val:'+arr[i]+' int'+int);
		}
		int=(delta? arr[i]-prev: arr[i] ) +1 ;
		if (int<0 && delta) {
			throw new Error('negative delta', arr[i],'prev',prev);
		}
		prev=arr[i]||0;
	}
	//new TextDecoder is quite fast
	return new TextDecoder().decode(s.subarray(0,idx)); //slice will make new copy
}
export const unpackInt=(s,delta=false)=>{
	let arr=[];
	//let started=false;
	if (!s) return [];
	let o,i=0,c=0,prev=0;
	while (i<s.length) {
		o=s.charCodeAt(i) - CodeStart;
		if (o<BYTE2_START) {
			//single byte
		} else if (o<BYTE3_START) {
			const i1=s.charCodeAt(++i) - CodeStart;
			o-=BYTE2_START;
			o = o*BYTE_MAX + i1 + BYTE1_MAX;
		} else if (o<BYTE4_START) {
			const i2=s.charCodeAt(++i) - CodeStart;
			const i1=s.charCodeAt(++i) - CodeStart;
			o-=BYTE3_START;
			o = o*BYTE_MAX*BYTE_MAX + i2*BYTE_MAX + i1 + BYTE2_MAX ;
		} else if (o<BYTE5_START) {
			const i3=s.charCodeAt(++i) - CodeStart;
			const i2=s.charCodeAt(++i) - CodeStart;
			const i1=s.charCodeAt(++i) - CodeStart;
			o-=BYTE4_START;
			o = o*BYTE_MAX*BYTE_MAX*BYTE_MAX + i3*BYTE_MAX*BYTE_MAX + i2*BYTE_MAX + i1+BYTE3_MAX ;		
		} else if (o<SEP2DITEM) {
			const i4=s.charCodeAt(++i) - CodeStart;
			const i3=s.charCodeAt(++i) - CodeStart;
			const i2=s.charCodeAt(++i) - CodeStart;
			const i1=s.charCodeAt(++i) - CodeStart;
			o-=BYTE5_START;
			o = o*BYTE_MAX*BYTE_MAX*BYTE_MAX*BYTE_MAX
			+ i4*BYTE_MAX*BYTE_MAX*BYTE_MAX+i3*BYTE_MAX*BYTE_MAX 
			+ i2*BYTE_MAX + i1+BYTE3_MAX ;		
		} else {
			throw new Error("exit max integer 0x7f,"+ o);
		}

		arr[c] = o + (delta?prev:0)  - 1;
		prev=arr[c];
		c++;
		i++;
	}
	return arr; // return normal array , easier for consequence operation (intersect, union)
}
export const unpack1=(str)=>{
	const arr=[];
	let i1=0;
	const count=Math.floor(str.length);
	for (let i=0;i<count;i++) {
		i1=str.charCodeAt(i*3) -CodeStart;
		arr.push( i1-1 );
	}
	return arr;
}
export const pack1=(arr)=>{
	let s=new Uint8Array(arr.length);
	let idx=0;
	for (let i=0;i<arr.length;i++) {
		if (arr[i]>=maxlen1) throw new Error("exit boundary "+arr[i])
		let int=arr[i] +1;
		if (isNaN(int)) int=0;
		s[idx++] = int+CodeStart; //allow -1
	}
	return new TextDecoder().decode(s);
}
export const intersect=(arr1,arr2)=>{
    const out=[];
    let j=0;
    for (let i=0;i<arr1.length;i++) {
        let v=arr1[i];
        while (j<arr2.length) {
            if (arr2[j]>=v) break;
            j++;
        }
        if (v==arr2[j] && out[out.length-1]!==v) out.push(v);
        if (j==arr2.length) break;
    }
    return out;
}
export const CJKRanges={
    'BMP': [0x4e00,0x9fa5],
    'ExtA':[0x3400,0x4dff],
    'ExtB':[0x20000,0x2A6FF],
    'ExtC':[0x2A700,0x2B73F],
    'ExtD':[0x2B740,0x2B81F],
    'ExtE':[0x2B820,0x2CEAF],
    'ExtF':[0x2CEB0,0x2EBE0],
    'ExtG':[0x30000,0x3134F],
    'ExtH':[0x31350,0x323AF],
    'ExtZ':[0xA0000,0xD47FF]
}
export const CJKRangeName=(s)=>{//return cjk range name by a char or unicode number value or a base 16 string
    let cp=0;
    if (typeof s==='string') {
        const code=parseInt(s,16);
        if (!isNaN(code)) {
            cp=code;
        } else {
            cp=s.codePointAt(0)||0;
        }
    }
    for (let rangename in CJKRanges) {
        const [from,to]=CJKRanges[rangename];
        if (cp>=from && cp<=to) return rangename;
    }
}

export const bsearch = (arr, obj) =>{
	let low = 0, high = arr.length-1, mid;
	while (low < high) {
	  	mid = (low + high) >> 1;
	  	if (arr[mid] === obj)  {
			while (mid>-1 &&arr[mid-1]===obj ) mid--; //值重覆的元素，回逆到第一個
			return mid;
	  	}
	  	(arr[mid] < obj) ? low = mid + 1 : high = mid;
	}
	return low;
}

export const bsearchNumber = (arr, obj) =>{
	let low = 0, high = arr.length-1, mid;
	while (low < high) {
		mid = (low + high) >> 1;
		if (arr[mid] === obj)  {
			while (mid>-1 &&arr[mid-1]===obj ) mid--; //值重覆的元素，回逆到第一個
			return mid;
		}
		(arr[mid] < obj) ? low = mid + 1 : high = mid;
	}
	return low;
}
  
export const alphabetically0 = (a, b) => a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0;  


export const loadRawText=(raw)=>{
	//3 times faster than readFileSync with encoding
	//buffer is hold in C++ object instead of node.js heap
	const dv=new DataView(raw.buffer);
	const encoding=dv.getUint16(0)==0xfffe?'utf-16le':'utf-8'; //only support utf16 le and utf8
	const decoder=new TextDecoder(encoding);
	let s=decoder.decode(raw); 
	if (s.charCodeAt(0)===0xfeff) s=s.slice(1); //BOM is okay, no memory write involved

	// DOS style crlf get 300% memory consumption penalty 
	if (s.indexOf('\r')>-1) s=s.replace(/\r?\n/g,'\n');
	return s.split('\n');
}