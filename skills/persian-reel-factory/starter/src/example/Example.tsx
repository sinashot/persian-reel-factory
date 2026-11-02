import React from 'react';
import {FA} from '../fonts';
import words from '../../public/example/words.json';
import cues from './cues.json';
import {Burst, COL, CX, Chip, ChipRow, CompareBars, Counter, ReelSpec, ReelTemplate, Ripple, Title, enter, glow, leave, mix, move, punch, span} from '../kit/ReelKit';

/* Example reel (the one that introduced this skill, made with it): «اگه با کلود ریلز می‌سازی، نصف توکن‌هات رو دور می‌ریزی».
   Pattern to copy: cues.json holds every time; Hook and Cta are free-form; each chapter is
   {name, at, vis, chips, hits}; a vis draws only inside x 80..920, y 640..1110. */
export const EXAMPLE_SECONDS = cues.duration;
export const EXAMPLE_FPS = 60;
const B = cues.beats;
const SC = cues.scenes;
const MONO = 'ui-monospace, Consolas, "Courier New", monospace';

/* ------------------------------------------------------------------ small pieces */
const Tile: React.FC<{x: number; y: number; w: number; h: number; label: string; t: number; at: number; c: string; dashed?: boolean; fill?: number; check?: number}> = ({x, y, w, h, label, t, at, c, dashed, fill = 0, check = 0}) => {
	const p = enter(t, at, 0.45);
	if (p <= 0) return null;
	return (
		<div dir="rtl" lang="fa" style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 22, border: `4px ${dashed && fill < 0.5 ? 'dashed' : 'solid'} ${c}`,
			background: `${c}${fill > 0.5 ? '40' : '18'}`, boxShadow: fill > 0.5 ? `0 0 34px ${c}88` : `0 0 18px ${c}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
			opacity: p, transform: `translateY(${(1 - p) * -40}px) scale(${mix(1.2, 1, p) * (1 + punch(t, at + 0.3, 0.3) * 0.05)})`}}>
			<span style={{fontFamily: FA, fontWeight: 800, fontSize: 40, color: COL.white}}>{label}</span>
			{check > 0 && <span style={{fontFamily: FA, fontWeight: 900, fontSize: 40, color: COL.green, opacity: check, transform: `scale(${mix(1.8, 1, check)})`}}>✓</span>}
		</div>
	);
};

const Phone: React.FC<{t: number; at: number; y: number}> = ({t, at, y}) => {
	const p = enter(t, at - 0.2, 0.5);
	if (p <= 0) return null;
	const part = (k: number) => enter(t, at + 0.35 + k * 0.4, 0.4);
	const glowOn = punch(t, B.skill, 0.6);
	return (
		<div style={{position: 'absolute', left: CX - 155, top: y - 270, width: 310, height: 540, borderRadius: 46, border: `6px solid ${COL.soft}`, background: 'rgba(8,12,44,.85)', opacity: p,
			transform: `scale(${mix(0.7, 1, p) * (1 + glowOn * 0.04)})`, boxShadow: `0 0 ${30 + glowOn * 40}px rgba(57,198,255,${0.25 + glowOn * 0.4})`}}>
			{/* the mini reel builds itself: rail, title, visual, caption */}
			<div style={{position: 'absolute', top: 54, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10, opacity: part(0)}}>
				{[0, 1, 2, 3].map((k) => <div key={k} style={{width: 22, height: 22, borderRadius: 11, border: `3px solid ${k === 0 ? COL.yellow : COL.soft}`}} />)}
			</div>
			<div style={{position: 'absolute', top: 110, left: 50, right: 50, height: 30, borderRadius: 15, background: COL.yellow, opacity: part(1), transform: `scaleX(${part(1)})`}} />
			<div style={{position: 'absolute', top: 160, left: 85, right: 85, height: 20, borderRadius: 10, background: COL.white, opacity: part(1) * 0.8}} />
			<div style={{position: 'absolute', top: 220, left: 95, width: 120, height: 120, borderRadius: '50%', border: `6px solid ${COL.cyan}`, opacity: part(2), transform: `scale(${part(2)}) rotate(${t * 40}deg)`, borderTopColor: 'transparent'}} />
			<div style={{position: 'absolute', top: 380, left: 40, right: 40, height: 36, borderRadius: 12, background: 'rgba(5,7,28,.9)', border: `2px solid ${COL.soft}55`, opacity: part(3), overflow: 'hidden'}}>
				<div style={{position: 'absolute', top: 10, right: 14, width: mix(0, 150, span(t, at + 1.6, at + 4)), height: 16, borderRadius: 8, background: COL.yellow}} />
			</div>
		</div>
	);
};

/* ------------------------------------------------------------------ hook */
const Hook: React.FC<{t: number}> = ({t}) => {
	const out = move(t, 3.7, 4.1);
	const red = enter(t, B.trash - 0.05, 0.25);
	return (
		<>
			{out < 1 && (
				<>
					<Title y={mix(340, 260, out)} size={78} t={t} at={-0.6} o={1 - out}>با کلود ریلز می‌سازی؟</Title>
					<div style={{opacity: 1 - out}}>
						<Counter from={0} to={128400} t={t} t0={0.25} t1={B.trash} y={700} size={150} color={red > 0.5 ? COL.red : COL.yellow} />
						<div dir="rtl" lang="fa" style={{position: 'absolute', left: CX, top: 830, transform: 'translate(-50%, -50%)', fontFamily: FA, fontWeight: 800, fontSize: 46, color: COL.soft, opacity: enter(t, 0.3, 0.4)}}>توکن</div>
						{red > 0 && (
							<div style={{position: 'absolute', left: CX, top: 700, width: 620, height: 12, marginLeft: -310, borderRadius: 6, background: COL.red, boxShadow: `0 0 24px ${COL.red}`, transform: `rotate(-8deg) scaleX(${red})`}} />
						)}
						<ChipRow y={950}>
							<Chip text="نصفش هدر می‌ره" t={t} t0={B.trash} tone="red" />
						</ChipRow>
						<Ripple x={CX} y={700} t={t} at={B.trash} c={COL.red} r={340} />
						<Burst x={CX} y={700} t={t} at={B.trash} c={COL.red} />
					</div>
				</>
			)}
			{out > 0 && (
				<>
					<Title y={330} size={72} t={t} at={3.9}>این ریل رو یه اسکیل ساخته</Title>
					<Phone t={t} at={B.reel} y={770} />
					<Burst x={CX} y={770} t={t} at={B.skill} c={COL.cyan} />
					<ChipRow y={1110}>
						<Chip text="نصف توکن" t={t} t0={B.half} tone="green" />
						<Chip text="۲ برابر سریع‌تر" t={t} t0={B.fast} tone="cyan" />
					</ChipRow>
				</>
			)}
		</>
	);
};

/* ------------------------------------------------------------------ chapter visuals (inside x 80..920, y 640..1110) */
const Template: React.FC<{t: number}> = ({t}) => {
	const xs = [CX + 175, CX - 175];
	const ys = [690, 802, 914];
	const ready = ['هوک', 'زیرنویس', 'موزیک', 'کادر امن'];
	const zero = enter(t, B.zero - 0.1, 0.4) * (1 - leave(t, B.text - 0.4, 0.3));
	return (
		<>
			{ready.map((r, k) => (
				<Tile key={k} x={xs[k % 2]} y={ys[Math.floor(k / 2)]} w={330} h={92} label={r} t={t} at={B.tpl + 0.3 + k * 0.25} c={COL.cyan} check={enter(t, B.tpl + 0.8 + k * 0.25, 0.3)} />
			))}
			<Tile x={xs[0]} y={ys[2] + 0} w={330} h={92} label="متن" t={t} at={B.tpl + 1.4} c={COL.yellow} dashed fill={enter(t, B.text, 0.3)} />
			<Tile x={xs[1]} y={ys[2] + 0} w={330} h={92} label="تصویر" t={t} at={B.tpl + 1.6} c={COL.yellow} dashed fill={enter(t, B.image, 0.3)} />
			{zero > 0 && (
				<div style={{position: 'absolute', left: CX, top: 1030, transform: `translate(-50%, -50%) scale(${mix(0.6, 1, zero)})`, opacity: zero, display: 'flex', alignItems: 'center', gap: 18}}>
					<span style={{fontFamily: MONO, fontWeight: 700, fontSize: 52, color: COL.soft, textDecoration: 'line-through', textDecorationColor: COL.red, textDecorationThickness: 6}}>{'</> 0→100'}</span>
				</div>
			)}
		</>
	);
};

const Tokens: React.FC<{t: number}> = ({t}) => (
	<>
		<CompareBars t={t} at={B.bars} y={680} rows={[{label: 'بدون اسکیل', value: 1, c: COL.red, at: B.bars}, {label: 'با اسکیل', value: 0.5, c: COL.green, at: B.bars + 1}]} />
		<div dir="ltr" style={{position: 'absolute', left: CX, top: 1035, transform: `translate(-50%, -50%) scale(${mix(1.6, 1, enter(t, B.fifty - 0.1, 0.4))})`, opacity: enter(t, B.fifty - 0.1, 0.4),
			fontFamily: FA, fontWeight: 900, fontSize: 120, lineHeight: 1.2, color: COL.green, filter: glow(COL.green, 12), whiteSpace: 'nowrap'}}>−۵۰٪</div>
	</>
);

const Clock: React.FC<{t: number}> = ({t}) => {
	const p = enter(t, SC.ch3 + 0.2, 0.5);
	const fill = mix(span(t, SC.ch3 + 0.4, B.hour), 0.5, move(t, B.halfHour - 0.2, B.halfHour + 0.6));
	const mins = Math.round(fill * 60);
	const r = 175;
	const C = 2 * Math.PI * r;
	const done = enter(t, B.halfHour + 0.5, 0.4);
	return (
		<div style={{position: 'absolute', left: CX - 230, top: 870 - 230, width: 460, height: 460, opacity: p, transform: `scale(${mix(0.7, 1, p)})`}}>
			<svg width={460} height={460} viewBox="0 0 460 460" style={{overflow: 'visible'}}>
				<circle cx={230} cy={230} r={r} fill="rgba(8,12,44,.6)" stroke="rgba(185,194,234,.18)" strokeWidth={22} />
				<circle cx={230} cy={230} r={r} fill="none" stroke={done > 0.5 ? COL.green : COL.cyan} strokeWidth={22} strokeLinecap="round" strokeDasharray={`${C * fill} ${C}`}
					transform="rotate(-90 230 230)" style={{filter: glow(done > 0.5 ? COL.green : COL.cyan, 10)}} />
				<rect x={205} y={14} width={50} height={26} rx={8} fill={COL.soft} />
			</svg>
			<div dir="rtl" lang="fa" style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center'}}>
				<div>
					<div style={{fontFamily: FA, fontWeight: 900, fontSize: 120, lineHeight: 1.1, color: done > 0.5 ? COL.green : COL.white}}>{mins === 0 ? '۰' : mins.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])}</div>
					<div style={{fontFamily: FA, fontWeight: 700, fontSize: 40, color: COL.soft}}>دقیقه</div>
				</div>
			</div>
		</div>
	);
};

const Auto: React.FC<{t: number}> = ({t}) => {
	const cells: {label: string; at: number; c: string; icon: (o: number) => React.ReactNode}[] = [
		{label: 'صدا', at: B.voice, c: COL.cyan, icon: () => (
			<svg width={120} height={60}>{Array.from({length: 9}, (_, i) => {
				const h = 14 + Math.abs(Math.sin(t * 7 + i * 0.9)) * 40;
				return <rect key={i} x={i * 13 + 2} y={30 - h / 2} width={8} height={h} rx={4} fill={COL.cyan} />;
			})}</svg>
		)},
		{label: 'زیرنویس', at: B.subs, c: COL.yellow, icon: () => (
			<svg width={130} height={60}>
				<rect x={0} y={18} width={130} height={24} rx={12} fill="rgba(243,245,255,.25)" />
				<rect x={130 - ((t * 60) % 130)} y={18} width={44} height={24} rx={12} fill={COL.yellow} />
			</svg>
		)},
		{label: 'موزیک', at: B.music, c: COL.violet, icon: () => (
			<span style={{fontSize: 64, lineHeight: 1, color: COL.violet, display: 'inline-block', transform: `translateY(${Math.sin(t * 5) * 6}px)`}}>♫</span>
		)},
		{label: 'افکت', at: B.fx, c: COL.orange, icon: () => (
			<svg width={70} height={70} viewBox="-35 -35 70 70" style={{transform: `rotate(${t * 60}deg) scale(${1 + Math.sin(t * 6) * 0.08})`}}>
				<path d="M 0 -32 L 8 -8 L 32 0 L 8 8 L 0 32 L -8 8 L -32 0 L -8 -8 Z" fill={COL.orange} />
			</svg>
		)},
	];
	const xs = [CX + 170, CX - 170];
	const ys = [745, 925];
	const fr = enter(t, B.frame - 0.1, 0.6);
	return (
		<>
			{cells.map((c, k) => {
				const p = enter(t, c.at - 0.15, 0.4);
				if (p <= 0) return null;
				return (
					<div key={k} dir="rtl" lang="fa" style={{position: 'absolute', left: xs[k % 2] - 150, top: ys[Math.floor(k / 2)] - 78, width: 300, height: 156, borderRadius: 26, border: `4px solid ${c.c}`, background: `${c.c}1c`,
						boxShadow: `0 0 26px ${c.c}55`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: p, transform: `scale(${mix(0.6, 1, p)})`}}>
						<div style={{height: 70, display: 'grid', placeItems: 'center'}}>{c.icon(p)}</div>
						<span style={{fontFamily: FA, fontWeight: 800, fontSize: 38, color: COL.white}}>{c.label}</span>
					</div>
				);
			})}
			{fr > 0 && (
				<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<rect x={130} y={642} width={740} height={386} rx={34} fill="none" stroke={COL.green} strokeWidth={6} strokeDasharray="22 14" pathLength={1000}
						style={{strokeDashoffset: (1 - fr) * 1000, filter: glow(COL.green, 8)}} opacity={fr} />
				</svg>
			)}
		</>
	);
};

/* ------------------------------------------------------------------ CTA */
const Cta: React.FC<{t: number}> = ({t}) => {
	const card = enter(t, B.github - 0.3, 0.5);
	const bubble = enter(t, B.word - 0.2, 0.45);
	const btn = enter(t, B.follow - 0.15, 0.45);
	const press = punch(t, B.follow + 0.5, 0.35);
	const typed = Math.round(mix(0, 20, span(t, B.github - 0.1, B.github + 1.0)));
	return (
		<>
			<Title y={330} size={78} t={t} at={SC.cta - 0.1}>رایگان روی گیت‌هاب</Title>
			<div style={{position: 'absolute', left: CX - 330, top: 450, width: 660, height: 110, borderRadius: 20, background: '#070A22', border: `3px solid ${COL.soft}66`, opacity: card,
				transform: `translateY(${(1 - card) * 30}px)`, display: 'flex', alignItems: 'center', padding: '0 30px', boxSizing: 'border-box', boxShadow: '0 0 30px rgba(57,198,255,.25)'}}>
				<span style={{fontFamily: MONO, fontSize: 40, color: COL.green, whiteSpace: 'pre'}}>{'$ '}</span>
				<span style={{fontFamily: MONO, fontSize: 40, color: COL.white, whiteSpace: 'pre'}}>{'persian-reel-factory'.slice(0, typed)}</span>
				<span style={{fontFamily: MONO, fontSize: 40, color: COL.yellow, opacity: Math.floor(t * 3) % 2 ? 1 : 0}}>▍</span>
			</div>
			<Title y={680} size={58} color={COL.white} t={t} at={B.word - 0.6}>کامنت کن تا لینکش رو بفرستم</Title>
			{bubble > 0 && (
				<div style={{position: 'absolute', left: CX, top: 860, transform: `translate(-50%, -50%) scale(${mix(0.4, 1, bubble) * (1 + punch(t, B.comment, 0.35) * 0.08)})`, opacity: bubble}}>
					<svg width={340} height={200} viewBox="0 0 340 200" style={{overflow: 'visible', filter: glow(COL.yellow, 12)}}>
						<path d="M 40 10 L 300 10 Q 330 10 330 40 L 330 130 Q 330 160 300 160 L 110 160 L 60 196 L 70 160 L 40 160 Q 10 160 10 130 L 10 40 Q 10 10 40 10 Z" fill="rgba(255,200,61,.16)" stroke={COL.yellow} strokeWidth={7} strokeLinejoin="round" />
					</svg>
					<div dir="rtl" lang="fa" style={{position: 'absolute', left: 0, top: 0, width: 340, height: 170, display: 'grid', placeItems: 'center', fontFamily: FA, fontWeight: 900, fontSize: 84, color: COL.yellow, lineHeight: 1}}>ریل</div>
				</div>
			)}
			<Ripple x={CX} y={850} t={t} at={B.word} c={COL.yellow} r={260} />
			<Burst x={CX} y={850} t={t} at={B.word} c={COL.yellow} />
			<div dir="rtl" lang="fa" style={{position: 'absolute', left: CX, top: 1100, transform: `translate(-50%, -50%) scale(${mix(0.6, 1, btn) * (1 - press * 0.08)})`, opacity: btn, padding: '10px 70px', borderRadius: 18,
				background: COL.cyan, color: '#04061A', fontFamily: FA, fontWeight: 900, fontSize: 52, boxShadow: '0 0 40px rgba(57,198,255,.6)', whiteSpace: 'nowrap', lineHeight: 1.5}}>
				+ فالو
			</div>
			<Ripple x={CX} y={1100} t={t} at={B.follow + 0.5} c={COL.cyan} r={240} />
		</>
	);
};

const SPEC: ReelSpec = {
	// audio: 'example/mix.wav', // uncomment once tools/reel_music.py has written the mix
	words,
	scenes: SC,
	hook: Hook,
	chapters: [
		{name: 'قالب آماده', at: B.tpl - 0.5, vis: Template, chips: [{text: 'فقط متن و تصویر جدیده', at: B.text, tone: 'yellow'}]},
		{name: 'نصف توکن', at: SC.ch2 + 0.1, vis: Tokens, chips: [{text: 'نصف کار از قبل آماده‌ست', at: B.ready, tone: 'green'}], hits: [{at: B.fifty, c: COL.green}]},
		{name: 'دو برابر سریع‌تر', at: SC.ch3 + 0.1, vis: Clock, chips: [{text: '۶۰ دقیقه ← ۳۰ دقیقه', at: B.deliver, tone: 'cyan'}], hits: [{at: B.halfHour, c: COL.cyan}]},
		{name: 'همه‌چیز خودکار', at: B.auto - 0.5, vis: Auto, chips: [{text: 'توی کادر امن اینستاگرام', at: B.insta, tone: 'green'}]},
	],
	cta: Cta,
	danger: [{at: B.trash, amount: 0.5}],
	flash: [B.trash],
	footer: 'Persian Reel Factory · رایگان و متن‌باز',
};

export const Example: React.FC<{guides?: boolean}> = ({guides}) => <ReelTemplate spec={SPEC} guides={guides} />;
