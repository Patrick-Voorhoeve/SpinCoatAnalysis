import './App.scss';
import { useEffect, useState } from 'react';
import Histogram               from './Histogram/Histogram';
import DataImage               from './DataImage/DataImage';
import SpectralGraph           from './SpectralGraph/SpectralGraph';
import { Image, Manifest }     from '../main/SampleParser';
import SpectralAverage         from './SpectralAverage/SpectralAverage';
import SpectralNormalised      from './SpectralNormalised/SpectralNormalised';
import BeforeVsAfter           from './BeforeVsAfter/BeforeVsAfter';

const defaultSettings = {
	showPoints     : true,
	minValue       : 0,
	maxValue       : 100,
	actualMaxValue : 100,
	disabledPoints : [] as string[],
	truncMax       : 0,
	truncMin       : 0,
}

export type Settings = typeof defaultSettings;

export default function App() {
	const [ pos    		, setPos 		] = useState({x: -300, y: 100, scale: 60});
	const [ mouse  		, setMouse		] = useState({ x: 0, y: 0, down: false, under: null as Element | null });
	const [ imageName 	, setImageName 	] = useState('')
	const [ settings	, setSettings   ] = useState(defaultSettings as Settings);
	const [ MANIFEST 	, setManifest 	] = useState(null as Manifest | null);
	const [ IMAGE		, setImage 		] = useState(null as Image | null);
	const [ IMAGES 		, setImages 	] = useState([] as Image[]);
	const [ loading 	, setLoading 	] = useState(false);

	useEffect(() =>{
		if(IMAGES.length === 0) (async () =>{
			console.log("Getting Manifest and Images");

			const images 		= await window.electron.getAllImages();
			const manifest 		= await window.electron.getManifest();

			console.log("Done getting Manifest and Data");

			setImageName(images[0].name);
			setImage(images[0])
			setManifest(manifest);
			setImages(images);
		})()
	}, [])

	useEffect(() => {
		setLoading(true);

		if(!IMAGE) return;
		const maxImageValue					= IMAGE.data.flat().reduce((max, cur) => max > cur ? max : cur, -Infinity) || settings.maxValue

		setSettings({...settings, maxValue: maxImageValue, actualMaxValue: maxImageValue, truncMax: maxImageValue });

		setImage(IMAGES.find(img => img.name === imageName) || null);
		setLoading(false);

	}, [ imageName ])

	useEffect(() => {
		const updateMousePosition = (ev: MouseEvent) => {
			const down        = ev.buttons    === 1;
			const newX        = ev.clientX;
			const newY        = ev.clientY;
			const prevDown    = mouse.down;
			const prevX       = mouse.x;
			const prevY       = mouse.y;

			let underPoint    = mouse.under;

			if(down && !prevDown) underPoint = document.elementFromPoint(newX, newY);

			if(down && prevDown) {
				const diffX    = prevX - newX;
				const diffY    = prevY - newY;

				// Dont move if there is an input under the cursor.
				if(underPoint?.nodeName === 'INPUT') return;
				if(underPoint?.className.includes('mantine-Slider-thumb')) return;
				if(underPoint?.className.includes('mantine-Slider-trackContainer')) return;
				if(underPoint?.className.includes('mantine-Slider-track')) return;
				if(underPoint?.className.includes('mantine-Slider-bar')) return;
				if(underPoint?.className.includes('settings')) return;
				if(underPoint?.className.includes('row')) return;

				setPos({...pos, x: pos.x - diffX, y: pos.y - diffY })
			}

			setMouse({ x: newX, y: newY, down: down, under: underPoint});
		}

		const updateScrollWheel = (ev: WheelEvent) => {
			const scrollAmount = 5;
			setPos({...pos, scale: pos.scale + (ev.deltaY > 0 ? -scrollAmount : scrollAmount) });
		}

		window.addEventListener('mousemove', updateMousePosition);
		window.addEventListener('wheel', updateScrollWheel)

		return () => {
			window.removeEventListener('mousemove', updateMousePosition);
			window.removeEventListener('wheel', updateScrollWheel);
		  };
	})


	return (
	<div className='App'>
		<div className='scaler' style={{ transform: `scale(${pos.scale}%)`}}>
			<div className='Content' style={{
				transform: `translate3d(${pos.x}px, ${pos.y}px, 0px)`,
			}}>
				<DataImage 				imageName={imageName} setImageName={setImageName} settings={settings} setSettings={setSettings} MANIFEST={MANIFEST} IMAGE={IMAGE} />
				<BeforeVsAfter 			imageName={imageName} setImageName={setImageName} settings={settings} setSettings={setSettings} MANIFEST={MANIFEST} IMAGE={IMAGE} IMAGES={IMAGES} />
				<Histogram 				imageName={imageName} settings={settings} MANIFEST={MANIFEST} IMAGE={IMAGE} />
				<SpectralGraph 			imageName={imageName} settings={settings} MANIFEST={MANIFEST} IMAGE={IMAGE} />
				<SpectralAverage 		imageName={imageName} settings={settings} MANIFEST={MANIFEST} IMAGE={IMAGE} />
				<SpectralNormalised 	imageName={imageName} settings={settings} MANIFEST={MANIFEST} IMAGE={IMAGE} />

			</div>
		</div>
	</div>
  );
}
