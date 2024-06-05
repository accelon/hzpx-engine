/* eslint-disable */
//import typescript from "@rollup/plugin-typescript";
//import resolve from '@rollup/plugin-node-resolve'
export default {
	input: "node.ts",
	output: [
		{
			file: "index.cjs",
			format: "cjs",
			name: "named",
			exports: "named",
		}
	]
	//plugins:[resolve()]
	//plugins: [typescript({ tsconfig: false, target: "es5" })],
};
