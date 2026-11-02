import {continueRender, delayRender, staticFile} from 'remotion';

/* Load Vazirmatn (OFL) before the first frame. A missing Persian font is the most common
   silent failure: Chrome falls back to a system font and nobody notices until review. */
const handle = delayRender('Loading Vazirmatn');
new FontFace('Vazirmatn', `url(${staticFile('fonts/Vazirmatn-VF.woff2')}) format('woff2')`, {weight: '100 900'})
	.load()
	.then((f) => {
		document.fonts.add(f);
		continueRender(handle);
	})
	.catch((err) => {
		console.error('Vazirmatn failed to load', err);
		continueRender(handle);
	});

export const FA = '"Vazirmatn", Tahoma, sans-serif';
