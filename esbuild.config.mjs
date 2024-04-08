import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;
const prod = process.argv[2] === "production";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envFilePath = resolve(__dirname, ".env");
const envConfig = config({ path: envFilePath });
const envVars = Object.entries(envConfig.parsed || {}).reduce(
	(acc, [key, value]) => {
		acc[`process.env.${key}`] = JSON.stringify(value);
		return acc;
	},
	{}
);
const context = await esbuild.context({
	banner: {
		js: banner,
	},
	entryPoints: ["main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins,
	],
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true,
	allowOverwrite: true,
	outfile: "main.js",
	define: envVars,
});

if (prod) {
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}
