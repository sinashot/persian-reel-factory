import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FA} from '../fonts';

/* ============================================================================================
   Persian Reel Factory — the reel template. Everything every reel keeps the same lives here,
   so a new reel only writes its copy, its cue times and one small visual per chapter.
   Claude: you do not need to read this file. The API is listed in SKILL.md.

   Fixed rules:
   - Instagram safe zone: every word and key visual inside x 80..920, y 230..1440
     (right 160 px = like/comment/share rail, bottom 480 px = caption + username).
   - Minimal backdrop: navy gradient + a few soft bokeh, no lines or grids.
   - Restrained, lively motion: titles blur in with a light sweep, beat ripples, small particle
     bursts, the camera whips between chapters with a slight stretch. 2D transforms only.
   - Hook on frame 1, numbered rail, karaoke captions from words.json, one CTA, optional footer.
   ============================================================================================ */

export const W = 1080;
export const SAFE = {left: 80, right: 920, top: 230, bottom: 1440};
export const CX = (SAFE.left + SAFE.right) / 2;
export const COL = {yellow: '#FFC83D', white: '#F3F5FF', soft: '#B9C2EA', cyan: '#39C6FF', red: '#FF4D5E', orange: '#FFB547', violet: '#9C8CFF', green: '#4FE3A1'};

const E_IN = Easing.bezier(0.16, 1, 0.3, 1);
const E_OUT = Easing.bezier(0.7, 0, 0.84, 0);
const E_IO = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const enter = (t: number, t0: number, d = 0.5) => interpolate(t, [t0, t0 + d], [0, 1], {...clamp, easing: E_IN});
export const leave = (t: number, t1: number, d = 0.3) => interpolate(t, [t1, t1 + d], [0, 1], {...clamp, easing: E_OUT});
export const move = (t: number, t0: number, t1: number) => interpolate(t, [t0, t1], [0, 1], {...clamp, easing: E_IO});
export const span = (t: number, t0: number, t1: number) => interpolate(t, [t0, t1], [0, 1], clamp);
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const punch = (t: number, t0: number, d = 0.45) => (t < t0 || t > t0 + d ? 0 : 1 - E_IN((t - t0) / d));
export const fa = (s: string | number) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
export const rnd = (i: number, k: number) => {
	const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
	return x - Math.floor(x);
};
export const glow = (c: string, r = 14) => `drop-shadow(0 0 ${r}px ${c}) drop-shadow(0 0 ${r * 2.4}px ${c}88)`;

/* ------------------------------------------------------------------ backdrop */
const BOKEH = Array.from({length: 9}, (_, i) => ({x: 80 + rnd(i, 1) * 920, y: 300 + rnd(i, 2) * 1300, r: 60 + rnd(i, 3) * 120, warm: rnd(i, 4) < 0.35, ph: rnd(i, 5) * 6.28}));
const Backdrop: React.FC<{t: number; danger: number}> = ({t, danger}) => (
	<AbsoluteFill style={{background: 'radial-gradient(ellipse 100% 65% at 46% 44%, #1A2262 0%, #0E1444 50%, #04061A 100%)'}}>
		{BOKEH.map((b, i) => {
			const c = b.warm ? '255,190,90' : '110,170,255';
			return (
				<div key={i} style={{position: 'absolute', left: b.x - b.r, top: b.y - b.r, width: b.r * 2, height: b.r * 2, borderRadius: '50%',
					background: `radial-gradient(circle, rgba(${c},0.16) 0%, rgba(${c},0) 70%)`,
					transform: `translate(${Math.sin(t * 0.12 + b.ph) * 30}px, ${Math.cos(t * 0.1 + b.ph) * 40}px)`}} />
			);
		})}
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 55% at 46% 46%, rgba(255,55,80,0.45) 0%, rgba(120,0,30,0.15) 45%, rgba(0,0,0,0) 72%)', opacity: danger}} />
		<AbsoluteFill style={{background: 'radial-gradient(ellipse 120% 80% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.45) 100%)'}} />
	</AbsoluteFill>
);

/* ------------------------------------------------------------------ effects */
export const Ripple: React.FC<{x: number; y: number; t: number; at: number; c?: string; r?: number}> = ({x, y, t, at, c = COL.yellow, r = 300}) => {
	if (t < at || t > at + 0.9) return null;
	const p = (t - at) / 0.9;
	const e = E_IN(p);
	return (
		<div style={{position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, marginLeft: -r, marginTop: -r, borderRadius: '50%',
			border: `${mix(10, 2, e)}px solid ${c}`, opacity: (1 - p) * 0.7, transform: `scale(${mix(0.25, 1, e)})`, boxShadow: `0 0 30px ${c}88`}} />
	);
};
export const Burst: React.FC<{x: number; y: number; t: number; at: number; c?: string}> = ({x, y, t, at, c = COL.yellow}) => {
	if (t < at || t > at + 0.8) return null;
	const p = (t - at) / 0.8;
	const e = E_IN(p);
	return (
		<>
			{Array.from({length: 12}, (_, i) => {
				const a = (i / 12) * Math.PI * 2 + rnd(i, 9) * 0.3;
				const d = mix(20, 110 + rnd(i, 8) * 50, e);
				const s = mix(12, 3, p);
				return <div key={i} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', background: c, boxShadow: `0 0 12px ${c}`,
					opacity: 1 - p, transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px)`}} />;
			})}
		</>
	);
};

/* ------------------------------------------------------------------ type */
export const Title: React.FC<{children: React.ReactNode; y: number; size: number; color?: string; t: number; at: number; o?: number}> = ({children, y, size, color = COL.yellow, t, at, o = 1}) => {
	const p = enter(t, at, 0.6);
	const sw = interpolate(t, [at + 0.3, at + 1.3], [130, -30], clamp);
	const shiny = color === COL.yellow;
	return (
		<div dir="rtl" lang="fa" style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: y, transform: `translateY(calc(-50% + ${(1 - p) * 34}px))`, textAlign: 'center', opacity: p * o,
			filter: `blur(${(1 - p) * 14}px) ${shiny ? 'drop-shadow(0 0 26px rgba(255,180,40,.45))' : 'drop-shadow(0 0 22px rgba(120,170,255,.4))'} drop-shadow(0 6px 0 rgba(0,0,0,.35))`}}>
			<span style={{fontFamily: FA, fontWeight: 900, fontSize: size, lineHeight: 1.45,
				...(shiny
					? {backgroundImage: `linear-gradient(100deg, ${COL.yellow} ${sw - 12}%, #FFF6D8 ${sw}%, ${COL.yellow} ${sw + 12}%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}
					: {color})}}>
				{children}
			</span>
		</div>
	);
};

export type Tone = 'red' | 'cyan' | 'yellow' | 'violet' | 'green';
const toneColor = (tone: Tone) => ({red: COL.red, cyan: COL.cyan, yellow: COL.yellow, violet: COL.violet, green: COL.green})[tone];
export const Chip: React.FC<{text: string; t: number; t0: number; tone?: Tone}> = ({text, t, t0, tone = 'red'}) => {
	const p = enter(t, t0, 0.42);
	if (p <= 0) return null;
	const c = toneColor(tone);
	return (
		<div dir="rtl" lang="fa" style={{fontFamily: FA, fontWeight: 800, fontSize: 42, lineHeight: 1.6, color: COL.white, padding: '4px 26px', borderRadius: 999, whiteSpace: 'nowrap',
			border: `3px solid ${c}`, background: `${c}22`, boxShadow: `0 0 26px ${c}66, inset 0 0 18px ${c}33`, opacity: p, transform: `translateY(${(1 - p) * 26}px) scale(${mix(0.82, 1, p)})`}}>
			{text}
		</div>
	);
};
export const ChipRow: React.FC<{y: number; children: React.ReactNode}> = ({y, children}) => (
	<div dir="rtl" style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: y, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px 14px'}}>{children}</div>
);

/* ------------------------------------------------------------------ stat objects + share icon */
export const Counter: React.FC<{from: number; to: number; t: number; t0: number; t1: number; x?: number; y: number; size?: number; color?: string; suffix?: string; prefix?: string}> = ({from, to, t, t0, t1, x = CX, y, size = 120, color = COL.yellow, suffix = '', prefix = ''}) => {
	const v = Math.round(mix(from, to, move(t, t0, t1)));
	const o = enter(t, t0 - 0.3, 0.4);
	return (
		<div dir="rtl" lang="fa" style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', opacity: o, whiteSpace: 'nowrap', fontFamily: FA, fontWeight: 900, fontSize: size, color, lineHeight: 1.2, filter: glow(color, 12)}}>
			{prefix}{fa(v.toLocaleString('en-US').replace(/,/g, '٬'))}{suffix}
		</div>
	);
};
/* Two horizontal bars that compare a before/after value (0..1 of full width). */
export const CompareBars: React.FC<{t: number; at: number; rows: {label: string; value: number; c: string; at?: number}[]; y: number}> = ({t, at, rows, y}) => (
	<>
		{rows.map((r, k) => {
			const p = move(t, r.at ?? at + k * 0.5, (r.at ?? at + k * 0.5) + 0.9);
			const o = enter(t, (r.at ?? at + k * 0.5) - 0.3, 0.4);
			const full = SAFE.right - SAFE.left - 40;
			return (
				<div key={k} dir="rtl" style={{position: 'absolute', left: SAFE.left + 20, width: full, top: y + k * 150, opacity: o}}>
					<div lang="fa" style={{fontFamily: FA, fontWeight: 800, fontSize: 38, color: COL.soft, marginBottom: 10}}>{r.label}</div>
					<div style={{height: 54, borderRadius: 27, background: 'rgba(185,194,234,.12)'}}>
						<div style={{height: 54, borderRadius: 27, width: `${r.value * p * 100}%`, background: r.c, boxShadow: `0 0 26px ${r.c}88`}} />
					</div>
				</div>
			);
		})}
	</>
);
export const PLANE = 'M 80 230 L 560 60 L 400 520 L 300 330 Z M 300 330 L 560 60';
export const Plane: React.FC<{x: number; y: number; s: number; t: number; at: number}> = ({x, y, s, t, at}) => {
	const p = enter(t, at - 0.2, 0.6);
	const fly = move(t, at, at + 1.6);
	if (p <= 0) return null;
	return (
		<svg width={640} height={600} viewBox="0 0 640 600" style={{position: 'absolute', left: x - 320, top: y - 300 - fly * 50, opacity: p, transform: `translateX(${fly * 30}px) rotate(${fly * -6}deg) scale(${s * mix(0.7, 1, p)})`, overflow: 'visible'}}>
			<path d={PLANE} fill="rgba(57,198,255,.12)" stroke={COL.cyan} strokeWidth={14} strokeLinejoin="round" style={{filter: glow(COL.cyan, 14)}} />
		</svg>
	);
};

/* ------------------------------------------------------------------ captions */
type Wd = {w: string; s: number; e: number};
const chunk = (lines: {words: Wd[]}[]) => {
	const out: Wd[][] = [];
	for (const l of lines) {
		let cur: Wd[] = [];
		for (const w of l.words) {
			cur.push(w);
			if (/[،.؛:!؟]$/.test(w.w) || cur.length >= 5) {
				out.push(cur);
				cur = [];
			}
		}
		if (cur.length) out.push(cur);
	}
	return out;
};
const clean = (w: string) => w.replace(/[ِ]/g, '').replace(/ُ/g, '');
const Captions: React.FC<{t: number; chunks: Wd[][]}> = ({t, chunks}) => {
	let idx = -1;
	chunks.forEach((c, k) => {
		if (t >= c[0].s - 0.08) idx = k;
	});
	if (idx < 0) return null;
	const c = chunks[idx];
	const next = chunks[idx + 1];
	const end = Math.min(c[c.length - 1].e + 0.6, next ? next[0].s - 0.08 : 1e9);
	if (t > end) return null;
	const p = enter(t, c[0].s - 0.08, 0.22);
	return (
		<div dir="rtl" lang="fa" style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: 1270, textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 14}px)`}}>
			<span style={{fontFamily: FA, fontWeight: 800, fontSize: 50, lineHeight: 1.75, color: COL.white, background: 'rgba(5,7,28,.62)', padding: '6px 22px', borderRadius: 18,
				boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>
				{c.map((w, k) => (
					<span key={k} style={{color: t >= w.s - 0.05 && t < (c[k + 1]?.s ?? end) ? COL.yellow : COL.white}}>
						{clean(w.w)}
						{k < c.length - 1 ? ' ' : ''}
					</span>
				))}
			</span>
		</div>
	);
};

/* ------------------------------------------------------------------ rail + guides */
const Rail: React.FC<{t: number; n: number; cur: number; from: number; to: number}> = ({t, n, cur, from, to}) => {
	const o = enter(t, from - 0.4, 0.5) * (1 - leave(t, to - 0.3, 0.35));
	if (o <= 0) return null;
	return (
		<div dir="rtl" style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: 262, display: 'flex', justifyContent: 'center', gap: n > 4 ? 20 : 26, opacity: o}}>
			{Array.from({length: n}, (_, k) => {
				const active = k === cur;
				const done = k < cur;
				const c = active ? COL.yellow : done ? COL.cyan : 'rgba(185,194,234,.45)';
				return (
					<div key={k} style={{width: 70, height: 70, borderRadius: '50%', border: `4px solid ${c}`, background: active ? 'rgba(255,200,61,.18)' : done ? 'rgba(57,198,255,.16)' : 'transparent',
						boxShadow: active ? '0 0 26px rgba(255,190,60,.6)' : 'none', display: 'grid', placeItems: 'center', transform: `scale(${active ? 1.12 : 1})`}}>
						<span style={{fontFamily: FA, fontWeight: 900, fontSize: 38, color: c, lineHeight: 1}}>{fa(k + 1)}</span>
					</div>
				);
			})}
		</div>
	);
};
const Guides: React.FC = () => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: SAFE.top, background: 'rgba(255,0,0,.25)'}} />
		<div style={{position: 'absolute', left: 0, right: 0, top: SAFE.bottom, bottom: 0, background: 'rgba(255,0,0,.25)'}} />
		<div style={{position: 'absolute', left: SAFE.right, right: 0, top: 0, bottom: 0, background: 'rgba(255,0,0,.18)'}} />
	</AbsoluteFill>
);

/* ------------------------------------------------------------------ the template */
export type Chapter = {
	name: string;
	at: number; // when the chapter title appears (just before it is spoken)
	vis: React.FC<{t: number}>; // the chapter's own visual, drawn inside x 80..920, y ~640..1110
	chips?: {text: string; at: number; tone?: Tone}[];
	hits?: {at: number; c?: string}[]; // ripple + burst on the visual
};
export type ReelSpec = {
	audio?: string; // staticFile path of mix.wav (leave out while the voice is not made yet)
	words: {lines: {words: Wd[]}[]};
	scenes: Record<string, number>; // hook, ch1..chN, cta
	hook: React.FC<{t: number}>;
	chapters: Chapter[];
	cta: React.FC<{t: number}>;
	danger?: {at: number; amount?: number; d?: number}[]; // red tint on bad-news beats
	flash?: number[]; // white flash on the hardest beats
	footer?: string; // small line above the caption zone, e.g. a disclaimer or @handle
};

const ChapterPanel: React.FC<{t: number; c: Chapter; n: number; s0: number}> = ({t, c, n, s0}) => {
	const num = enter(t, s0 - 0.05, 0.5);
	const Vis = c.vis;
	return (
		<>
			<div style={{position: 'absolute', left: CX, top: 420, transform: `translate(-50%, -50%) scale(${mix(0.6, 1, num)}) rotate(${(1 - num) * -40}deg)`, opacity: num, width: 120, height: 120, borderRadius: '50%',
				border: `5px solid ${COL.yellow}`, background: 'rgba(255,200,61,0.12)', boxShadow: '0 0 34px rgba(255,190,60,.55)', display: 'grid', placeItems: 'center'}}>
				<span style={{fontFamily: FA, fontWeight: 900, fontSize: 76, color: COL.yellow, lineHeight: 1}}>{fa(n)}</span>
			</div>
			<Ripple x={CX} y={420} t={t} at={s0 + 0.05} r={180} />
			<Title y={570} size={c.name.length > 18 ? 64 : 76} t={t} at={c.at}>{c.name}</Title>
			<div style={{position: 'absolute', left: 0, top: 0, width: W, height: 1920, transform: `translateY(${(1 - enter(t, s0, 0.6)) * 50}px)`}}>
				<Vis t={t} />
			</div>
			{(c.hits ?? []).map((h, k) => (
				<React.Fragment key={k}>
					<Ripple x={CX} y={880} t={t} at={h.at} c={h.c} r={330} />
					<Burst x={CX} y={880} t={t} at={h.at} c={h.c} />
				</React.Fragment>
			))}
			<ChipRow y={1150}>
				{(c.chips ?? []).map((ch, k) => (
					<Chip key={k} text={ch.text} t={t} t0={ch.at} tone={ch.tone} />
				))}
			</ChipRow>
		</>
	);
};

export const ReelTemplate: React.FC<{spec: ReelSpec; guides?: boolean}> = ({spec, guides}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const keys = ['hook', ...spec.chapters.map((_, i) => `ch${i + 1}`), 'cta'];
	const starts = keys.map((k) => spec.scenes[k]);
	const whip = (s: number) => move(t, s - 0.22, s + 0.2);
	const cx = starts.slice(1).reduce((acc, s) => acc + whip(s) * W, 0);
	const st = starts.slice(1).reduce((acc, s) => acc + Math.sin(Math.PI * whip(s)) * 0.07, 0);
	let cur = 0;
	starts.forEach((s, k) => {
		if (t >= s - 0.02) cur = k;
	});
	const chunks = React.useMemo(() => chunk(spec.words.lines), [spec.words]);
	const danger = Math.max(0, ...(spec.danger ?? []).map((d) => punch(t, d.at, d.d ?? 1.1) * (d.amount ?? 0.5)));
	const flash = Math.max(0, ...(spec.flash ?? []).map((a) => punch(t, a, 0.3) * 0.5));
	const Hook = spec.hook;
	const Cta = spec.cta;
	return (
		<AbsoluteFill style={{background: '#04061A', overflow: 'hidden'}}>
			<Backdrop t={t} danger={danger} />
			<AbsoluteFill style={{transform: `translateX(${cx}px)`}}>
				{keys.map((k, i) => {
					if (Math.abs(cx - i * W) >= W) return null;
					return (
						<AbsoluteFill key={k} style={{transform: `translateX(${-i * W}px) scaleX(${1 + st})`}}>
							{k === 'hook' && <Hook t={t} />}
							{k.startsWith('ch') && <ChapterPanel t={t} c={spec.chapters[i - 1]} n={i} s0={starts[i]} />}
							{k === 'cta' && <Cta t={t} />}
						</AbsoluteFill>
					);
				})}
			</AbsoluteFill>
			<Rail t={t} n={spec.chapters.length} cur={cur - 1} from={spec.scenes.ch1} to={spec.scenes.cta} />
			<Captions t={t} chunks={chunks} />
			{spec.footer && <div dir="rtl" lang="fa" style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: 1395, textAlign: 'center', fontFamily: FA, fontWeight: 500, fontSize: 26, color: COL.soft, opacity: 0.7}}>
				{spec.footer}
			</div>}
			<AbsoluteFill style={{background: '#FFE9EC', opacity: flash, mixBlendMode: 'screen'}} />
			{guides && <Guides />}
			{spec.audio && <Audio src={staticFile(spec.audio)} />}
		</AbsoluteFill>
	);
};
