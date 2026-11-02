import React from 'react';
import {Composition} from 'remotion';
import {Example, EXAMPLE_FPS, EXAMPLE_SECONDS} from './example/Example';
// new_reel.py adds an import line here

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="ExampleReel" component={Example} durationInFrames={Math.round(EXAMPLE_SECONDS * EXAMPLE_FPS)} fps={EXAMPLE_FPS} width={1080} height={1920} />
		<Composition id="ExampleGuides" component={Example} defaultProps={{guides: true}} durationInFrames={Math.round(EXAMPLE_SECONDS * EXAMPLE_FPS)} fps={EXAMPLE_FPS} width={1080} height={1920} />
		{/* new_reel.py adds compositions here */}
	</>
);
