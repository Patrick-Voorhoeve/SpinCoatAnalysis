import './DataImage.scss';
import { Chart, registerables }                       from 'chart.js/auto';
import { useEffect, useRef, useState }                from "react"
import ColorScale								                             from 'color-scales';
import { Image, Manifest }                            from '../../main/SampleParser';
import { RangeSlider } 								                       from '@mantine/core'
import { Settings }	                                  from '../App';

Chart.register(...registerables);

type Props = {
	imageName: 		string
	setImageName: 	React.Dispatch<React.SetStateAction<string>>
	settings:		Settings
	setSettings:	React.Dispatch<React.SetStateAction<Settings>>
	MANIFEST:		Manifest | null
	IMAGE:			Image | null
}

export default function DataImage( { imageName, setImageName, settings, setSettings, MANIFEST, IMAGE }: Props ) {
	const [ loading , setLoading   ]	= useState(true);
	const canvas 						= useRef( null as HTMLCanvasElement | null );
	const [ sliderVal, setSliderval ]	= useState([0, settings.actualMaxValue] as [ number, number ]);

	useEffect(() => {
		setSliderval([settings.minValue, settings.maxValue ]);
	}, [ settings ])

	useEffect(() => {

		if(!MANIFEST)		return;
		if(!IMAGE)			return;

		const POINTS 		= MANIFEST.filter( man => man['Image Name'] === imageName );
		const INFO			= POINTS[0];
		const DATA 			= IMAGE.data;


		if(!DATA) return;
		if(!INFO) return;

		const absMax 		= 7000000;
		const data 			= DATA.map( row => row.map( v => Math.min(v, absMax )) );

		const flat 			= data.flat();
		const max 			= settings.maxValue;
		const min 			= settings.minValue;


		if(!canvas.current) return console.log("Could not find canvas ref");
		const ctx 			= canvas.current?.getContext("2d");
		if(!ctx) 		  	return console.log("Could not find canvas context");

		setLoading(true);

		const width			= INFO["# Pixels X"];
		const height		= INFO["# Pixels Y"];
		const startX		= INFO["Start X (μm)"];
		const startY		= INFO["Start Y (μm)"];
		const OffsetX 		= INFO["Offset X (μm)"];
		const OffsetY 		= INFO["Offset Y (μm)"];
		const resX			= INFO["Pixels / μm (X)"];
		const resY			= INFO["Pixels / μm (X)"];

		const RES 			= 10;
		ctx.canvas.width	= width * RES;
		ctx.canvas.height	= height * RES;

		const scale 		= new ColorScale(min, max, ["#000000", "#170635", "#df5633", "#fff021"]);

		/** Converts a position (x, y) into its canvas equivalent as upscaling */
		const posToPixel 	= ( X: number, Y: number ) => ({ x: X * RES, y: Y * RES });

		/** Function to convert a position (x, y) in ɥm into its row / column pixel equivilent */
		const umToPos		= ( X: number, Y: number ) => ({ x: (X - startX + OffsetX) / resX,  y: (Y - startY + OffsetY) / resY })

		const umToPixel		= ( X: number, Y: number) => posToPixel( umToPos( X, Y ).x, umToPos(X, Y).y );

		/** Draw the image to the canvas */
		ctx.clearRect( 0, 0, width, height );
		data.forEach( (row, X) => row.forEach( (val, Y) => {
			const { x, y } = posToPixel(X, Y);

			ctx.fillStyle = scale.getColor(val).toRGBString();
			ctx.fillRect(x, y, RES, RES)
		}))


		/** Draw every `point` to the canvas */
		if(settings.showPoints) POINTS.forEach( point => {
			const { x, y } 		= umToPixel(point.xPosition, point.yPosition);
			const size 			= RES * 1;

			if(settings.disabledPoints.includes(point.pointName)) return;

			ctx.beginPath();
			ctx.fillStyle 		=  `${point.color}`;
			ctx.strokeStyle		= `#FFFFFF`
			ctx.lineWidth		= 8;
			ctx.ellipse(x - (size / 2), y - (size / 2), size, size, 0, 0, 360);
			ctx.stroke();
			ctx.fill();
			ctx.closePath();

			ctx.font 			= 'bold 50px serif';
			ctx.fillStyle		= ctx.strokeStyle;
			ctx.lineWidth		= 0;
			// ctx.strokeText(`${point.pointName.replace('Point ', '')}`, x + size, y + size);
			ctx.fillText(`${point.pointName.replace('Point ', '')}`, x + size + 10, y + size);
		})

		setLoading(false);

	}, [ settings, IMAGE, MANIFEST ])

	return (
		<div className={`DataImage ${loading ? 'loading' : ''}`}>
			<div className='settings'>
				<div className='row'>
					<span className='selectSetting'>
						<select value={imageName} onChange={(ev) => {
							setImageName(ev.target.value);
						}}>
							{ [...new Set(MANIFEST?.map(man => man['Image Name'])) ].map(name => (
								<option > { name } </option>
							))}
						</select>
					</span>
					<span className='radioSetting'>
						<input type='checkbox' checked={ settings.showPoints } onClick={() => setSettings({ ...settings, showPoints: !settings.showPoints })} />
						<label> Show Points </label>
					</span>
				</div>

				<div className='row'>
					<span className='sliderSetting'>
						<RangeSlider min={0} value={sliderVal} max={settings.actualMaxValue} onChange={setSliderval} onChangeEnd={( val ) => {
							setSettings({...settings, minValue: val[0], maxValue: val[1] });
						}} />
					</span>
				</div>

				<div className='pointPicker'>
					{ MANIFEST?.filter(p => p['Image Name'] === imageName).map(point => (
						<div className={`point ${settings.disabledPoints.includes(point.pointName) ? 'disabled' : 'enabled'}`} onClick={() => {
							let dP 			= [...settings.disabledPoints];
							if(dP.includes(point.pointName)) dP.splice( dP.findIndex(p => p === point.pointName), 1 );
							else dP.push(point.pointName);

							console.log(dP)

							setSettings({ ...settings, disabledPoints: dP })
						}}>
							<div className='dot' style={{ backgroundColor: point.color }}/>
							<p> { point.pointName } </p>
						</div>
					)) }
				</div>
			</div>
			<canvas ref={ canvas } />
		</div>
	)
}
