import './DataImage.scss';
import { Chart, registerables }                             from 'chart.js/auto';
import { useEffect, useRef, useState }                      from "react"
import ColorScale											from 'color-scales';
import { Image, Manifest }                                  from '../../main/SampleParser';
import { RangeSlider, Text } 								from '@mantine/core'
import { Settings }	                                        from '../App';
import * as math 											from 'mathjs';
import { siRound }                                          from '../Helpers/Methods';

Chart.register(...registerables);

type Props = {
	imageName    : string
	setImageName : React.Dispatch<React.SetStateAction<string>>
	settings     : Settings
	setSettings  : React.Dispatch<React.SetStateAction<Settings>>
	MANIFEST     : Manifest | null
	IMAGE        : Image | null
}

export default function DataImage( { imageName, setImageName, settings, setSettings, MANIFEST, IMAGE }: Props ) {
	const [ loading , setLoading   ]	= useState(true);
	const canvas 						= useRef( null as HTMLCanvasElement | null );
	const [ slider1Val, setSlider1Val ]	= useState([0, settings.actualMaxValue] as [ number, number ]);
	const [ slider2Val, setSlider2Val ]	= useState([0, settings.actualMaxValue] as [ number, number ]);
	const [ mean      , setMean 	  ] = useState(0);
	const [ std 	  , setStd 		  ] = useState(0);
	const [ min 	  , setMin 		  ] = useState(0);
	const [ max 	  , setMax 		  ] = useState(0);

	useEffect(() => {
		setSlider1Val([settings.minValue, settings.maxValue ]);
		setSlider2Val([settings.truncMin, settings.truncMax ]);
	}, [ settings ])

	useEffect(() => {

		if(!MANIFEST)		return;
		if(!IMAGE)			return;

		const POINTS    	= MANIFEST.filter( man => man['Image Name'] === imageName );
		const INFO      	= POINTS[0];
		const DATA      	= IMAGE.data.map( row => row.map(val => val > settings.truncMax ? settings.truncMax : val).map(val => val < settings.truncMin ? settings.truncMin : val ) );


		if(!DATA) 			return;
		if(!INFO) 			return;

		const absMax   		= 7000000;
		const data     		= DATA.map( row => row.map( v => Math.min(v, absMax )) );

		const flat   		= data.flat();

		const max    		= Math.max(settings.maxValue, settings.minValue);
		const min    		= Math.min(settings.maxValue, settings.minValue);
		const mean 			= math.mean(flat);
		const std 			= Number(math.std(flat));

		setMin(min);
		setMax(max);
		setMean(mean);
		setStd(std);


		if(!canvas.current) return console.log("Could not find canvas ref");
		const ctx    		= canvas.current?.getContext("2d");
		if(!ctx) 		  	return console.log("Could not find canvas context");

		setLoading(true);

		const width      	= INFO["# Pixels X"];
		const height     	= INFO["# Pixels Y"];
		const startX     	= INFO["Start X (μm)"];
		const startY     	= INFO["Start Y (μm)"];
		const OffsetX    	= INFO["Offset X (μm)"];
		const OffsetY    	= INFO["Offset Y (μm)"];
		const resX       	= INFO["Pixels / μm (X)"];
		const resY       	= INFO["Pixels / μm (X)"];

		const RES           = 10;
		ctx.canvas.width    = width * RES;
		ctx.canvas.height   = height * RES;

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

	const info 		= MANIFEST?.find(man => man['Image Name'] === imageName);
	const imgHeight = document.getElementById('image')?.clientHeight || 100;
	const numDashes = 11;

	return (
		<div className={`DataImage ${loading ? 'loading' : ''}`}>

			<div id='informationBox' style={{
				transform: `translateX( -${(document.getElementById('informationBox')?.clientWidth || 0) + 80 }px)`
			}}>
				<span className='infoRow'>
					<h4> Sample Name </h4>
					<p> { info?.['Sample Name'] } </p>
				</span>
				<span className='infoRow'>
					<h4> Hydrogenation Temperature </h4>
					<p> { info?.['Annealing Temp (C)']} °C </p>
				</span>
				<span className='infoRow'>
					<h4> Hydrogenation Composition </h4>
					<p> { parseFloat(`${info?.['Annealing H2 in N2 (%)']}`) * 100}% H2 </p>
				</span>

				<span className='infoRow'>
					<h4> Image Name </h4>
					<p> { info?.['Image Name'] } </p>
				</span>
				<span className='infoRow'>
					<h4> Excitation Power </h4>
					<p> { info?.['Power (μW)'] } μW </p>
				</span>
				<span className='infoRow'>
					<h4> Exposure Time </h4>
					<p> { info?.['Exposure Time (s)'] } s </p>
				</span>
				<span className='infoRow'>
					<h4> Centre Wavelength </h4>
					<p> { info?.['Center Wavelength (nm)'] } nm  </p>
				</span>
				<span className='infoRow'>
					<h4> Filter </h4>
					<p> { info?.Filter }  </p>
				</span>
				<span className='infoRow'>
					<h4> Width </h4>
					<p> { info?.['Range X(μm)'] } μm  </p>
				</span>
				<span className='infoRow'>
					<h4> Height </h4>
					<p> { info?.['Range Y (μm)'] } μm  </p>
				</span>
				<span className='infoRow'>
					<h4> Mean Counts </h4>
					<p> { siRound(mean) }  </p>
				</span>
				<span className='infoRow'>
					<h4> Counts Standard Deviation </h4>
					<p> { siRound(std) }  </p>
				</span>
				<span className='infoRow'>
					<h4> Min Counts </h4>
					<p> { siRound(min) } </p>
				</span>
				<span className='infoRow'>
					<h4> Max Counts </h4>
					<p> { siRound(max) } </p>
				</span>


			</div>

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
						<p> Color Scale </p>
						<RangeSlider min={0} value={slider1Val} max={settings.actualMaxValue} onChange={setSlider1Val} onChangeEnd={( val ) => {
							setSettings({...settings, minValue: val[0], maxValue: val[1] });
						}} marks={[{ value: settings.truncMin, label: `${settings.truncMin}`}, { value: settings.actualMaxValue, label: settings.actualMaxValue}]}/>
					</span>
				</div>

				<div className='row'>
					<span className='sliderSetting'>
						<p > Truncate Data </p>
						<RangeSlider min={0} value={slider2Val} max={settings.actualMaxValue} onChange={setSlider2Val} onChangeEnd={( val ) => {
							setSettings({ ...settings, truncMin: val[0], truncMax: val[1] });

						}} marks={[{ value: settings.truncMin, label: `${settings.truncMin}`}, { value: settings.actualMaxValue, label: settings.actualMaxValue}]}/>
					</span>
				</div>


				<div className='pointPicker'>
					{ MANIFEST?.filter(p => p['Image Name'] === imageName).map(point => (
						<div className={`point ${settings.disabledPoints.includes(point.pointName) ? 'disabled' : 'enabled'}`} onClick={() => {
							let dP 			= [...settings.disabledPoints];
							if(dP.includes(point.pointName)) dP.splice( dP.findIndex(p => p === point.pointName), 1 );
							else dP.push(point.pointName);

							setSettings({ ...settings, disabledPoints: dP })
						}}>
							<div className='dot' style={{ backgroundColor: point.color }}/>
							<p> { point.pointName } </p>
						</div>
					)) }
				</div>
			</div>

			<div className='scale scaleX'>
				<div className='label x'> Distance (μm) </div>
				<div className='line'> </div>
				{ new Array(numDashes).fill(1).map( (d, i) => (
					<div className='dash' style={{
						transform: `translateY(${i * ((imgHeight + (imgHeight / numDashes)) / numDashes)}px)`
					}}> <p> {i * (info?.['Range X(μm)'] || 0) / 10 } </p> </div>
				))}
			</div>

			<div className='scale scaleY'>
				<div className='label y'> Distance (μm) </div>
				<div className='line'> </div>
				{ new Array(numDashes).fill(1).map( (d, i) => (
					<div className='dash vertical' style={{
						transform: `translateX(${i * ((imgHeight + (imgHeight / numDashes)) / numDashes)}px)`
					}}> <p> {i * (info?.['Range X(μm)'] || 0) / 10 } </p> </div>
				))}
			</div>

			<canvas id="image" ref={ canvas } />
		</div>
	)
}
