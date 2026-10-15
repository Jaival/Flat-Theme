// Generates every theme variant from src/palette.json + src/template.json.
// Usage: node scripts/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const palette = read('src/palette.json');
const template = read('src/template.json');

// ---- color helpers ----
const hex2rgb = h => [0, 2, 4].map(i => parseInt(h.slice(1 + i, 3 + i), 16) / 255);
const rgb2hex = c => '#' + c.map(x => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, '0')).join('');
function rgb2hsl([r, g, b]) {
	const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
	if (mx === mn) return [0, 0, l];
	const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
	const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
	return [h / 6, s, l];
}
function hsl2rgb([h, s, l]) {
	if (!s) return [l, l, l];
	const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
	const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
	return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}
const hsl = (hex, fn) => rgb2hex(hsl2rgb(fn(rgb2hsl(hex2rgb(hex.slice(0, 7)))))) + hex.slice(7);
const lum = h => { const f = c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; const [r, g, b] = hex2rgb(h).map(f); return .2126 * r + .7152 * g + .0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
// Dark, saturated teal: the background family that some variants shift.
const isDarkTeal = hex => { const [h, s, l] = rgb2hsl(hex2rgb(hex.slice(0, 7))); return h > .42 && h < .58 && l < .45 && s > .05; };

// ---- variants ----
// syntax: transform for token colors, editor.foreground and terminal ANSI colors.
// ui: transform for every other workbench color.
// overrides: exact values applied last, by color key.
const variants = [
	{
		file: 'flat-deep', label: 'Flat Deep', id: 'flat theme', // keeps the original id so existing users move to Deep
		syntax: ([h, s, l]) => [h, s * .72, l],
		ui: (hex, [h, s, l]) => isDarkTeal(hex) ? [h, s * .45, l * .78] : [h, s * .75, l],
		overrides: { 'statusBar.background': '#2a4a3f', 'statusBar.foreground': '#cfe8c0', 'activityBar.foreground': '#cfe8c0', 'activityBarBadge.background': '#cfe8c0', 'editor.selectionBackground': '#264a4b' },
	},
	{
		file: 'flat-muted', label: 'Flat Muted',
		syntax: ([h, s, l]) => [h, s * .6, Math.min(.9, l + .03)],
		ui: (hex, [h, s, l]) => isDarkTeal(hex) ? [h, s, l] : [h, s * .7, l],
		overrides: { 'statusBar.background': '#b9cf9a', 'activityBar.foreground': '#b9cf9a', 'activityBarBadge.background': '#b9cf9a' },
	},
	{
		file: 'flat-pastel', label: 'Flat Pastel',
		syntax: ([h, s, l]) => [h, s * .55, l + (.8 - l) * .45],
		ui: (hex, [h, s, l]) => isDarkTeal(hex) ? [h, s * .55, l + .06] : [h, s * .6, l],
		overrides: { 'statusBar.background': '#c9dcb8', 'activityBar.foreground': '#c9dcb8', 'activityBarBadge.background': '#c9dcb8' },
	},
	{
		file: 'flat-mist', label: 'Flat Mist',
		syntax: ([h, s, l]) => [h, s * .42, l + (.74 - l) * .35],
		ui: (hex, [h, s, l]) => isDarkTeal(hex) ? [h, Math.min(s, .12), l + .08] : [h, s * .45, l],
		overrides: { 'statusBar.background': '#3b4a48', 'statusBar.foreground': '#d9e4dc', 'activityBar.foreground': '#d9e4dc', 'activityBarBadge.background': '#d9e4dc' },
	},
];

// ---- build ----
const resolve = v => typeof v === 'string' ? v.replace(/\{(\w+)\}/g, (_, k) => {
	if (!(k in palette)) throw new Error(`Unknown palette color {${k}}`);
	return palette[k];
}) : v;
const isColor = v => typeof v === 'string' && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v);
const isSyntaxKey = k => k === 'editor.foreground' || (k.startsWith('terminal.ansi') && !/Black$/.test(k));

// Raise lightness until a text color reads at `min` contrast on the background.
function ensureContrast(hex, bg, min = 4.5) {
	let out = hex;
	for (let i = 0; i < 40 && contrast(out.slice(0, 7), bg) < min; i++) out = hsl(out, ([h, s, l]) => [h, s, Math.min(1, l + .01)]);
	return out;
}

const contributes = [];
for (const v of variants) {
	const t = structuredClone(template);
	t.name = v.label;
	const syn = hex => hsl(hex, v.syntax);
	for (const [k, val] of Object.entries(t.colors)) {
		const c = resolve(val);
		if (!isColor(c)) { t.colors[k] = c; continue; }
		t.colors[k] = isSyntaxKey(k) ? syn(c) : hsl(c, hslv => v.ui(c, hslv));
	}
	Object.assign(t.colors, v.overrides);
	const bg = t.colors['editor.background'];
	const fixes = [];
	const fixText = (c, where) => { const out = ensureContrast(c, bg); if (out !== c) fixes.push(`${where} ${c}->${out}`); return out; };
	for (const k of Object.keys(t.colors)) if (isSyntaxKey(k)) t.colors[k] = fixText(t.colors[k], k);
	// UI text that was readable in the base theme must stay readable in every variant.
	const baseBg = resolve(template.colors['editor.background']);
	for (const k of Object.keys(t.colors)) {
		const base = resolve(template.colors[k]);
		if (isSyntaxKey(k) || k in v.overrides || !/foreground$/i.test(k) || !isColor(base) || base.length > 7) continue;
		// File-name colors and bracket errors are text too, so always lift them.
		if (contrast(base, baseBg) >= 4.4 || /^gitDecoration\.|unexpectedBracket/.test(k)) t.colors[k] = fixText(t.colors[k], k);
	}
	for (const rule of t.tokenColors) {
		const fg = resolve(rule.settings.foreground);
		if (isColor(fg)) rule.settings.foreground = fixText(syn(fg), rule.name || rule.scope);
	}
	for (const [k, val] of Object.entries(t.semanticTokenColors)) {
		const fg = resolve(typeof val === 'string' ? val : val.foreground);
		const out = fixText(syn(fg), k);
		t.semanticTokenColors[k] = typeof val === 'string' ? out : { ...val, foreground: out };
	}
	const rel = `themes/${v.file}-color-theme.json`;
	fs.writeFileSync(path.join(root, rel), JSON.stringify(t, null, '\t') + '\n');
	contributes.push({ ...(v.id ? { id: v.id } : {}), label: v.label, uiTheme: 'vs-dark', path: `./${rel}` });
	const unique = [...new Set(fixes)];
	console.log(`${rel}  background ${bg}${unique.length ? `  (${unique.length} colors lifted for contrast)` : ''}`);
}

// Keep package.json's theme list in sync with the variants above.
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.contributes.themes = contributes;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
