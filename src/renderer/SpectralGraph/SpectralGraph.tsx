import './SpectralGraph.scss';
import { useState, useEffect, useRef }                               from 'react';
import { Chart, ChartConfiguration, registerables }                  from 'chart.js/auto';
import { Image, Manifest }                                           from '../../main/SampleParser';
import { Settings }                                                  from '../App';

Chart.register(...registerables);


type Props = {
	imageName: 		string
	MANIFEST:		Manifest | null
	IMAGE:			Image | null
	settings:		Settings

}

export default function SpectralGraph( { imageName, IMAGE, MANIFEST, settings }: Props ) {
	const [ chart, setChart   ] 	= useState(null as Chart | null);
	const [ loading, setLoading ]	= useState(true);
	const canvas 					= useRef( null as HTMLCanvasElement | null );

	useEffect(() => {
		if(!IMAGE)		 	return;
		if(!MANIFEST)		return;

		const POINTS 		= MANIFEST.filter( point => point['Image Name'] === imageName ).filter(point => !settings.disabledPoints.includes(point.pointName) );
		const MAX 			= POINTS.map(d => d.values).flat().reduce((max, cur) => cur > max ? cur : max, 0);

		if(!canvas.current) return console.log("Could not find canvas ref");
		const ctx 			= canvas.current?.getContext("2d");
		if(!ctx) 		  	return console.log("Could not find canvas context");

		const options 		= {
			type: 'scatter',
			options: {
				events: [],
				animation: {
					duration: 0,
				},
				plugins: {
					annotation: {
						annotations: [{
							type: 'line',
							borderColor: '#0593ff44',
							xMin: 575,
							xMax: 575,
						},
						{
							type: 'label',
							content: '575nm',
							xValue: 575 + 20,
							yValue: MAX * 0.9,
							color: '#0593ff44',
							font: {
								size: 14,
								weight: 'bold',
							}
						},
						{
							type: 'line',
							borderColor: '#ff333644',
							xMin: 636,
							xMax: 636,
						},
						{
							type: 'label',
							content: '636nm',
							xValue: 636 + 20,
							yValue: MAX * 0.3,
							color: '#ff333644',
							font: {
								size: 14,
								weight: 'bold',
							}
						},
					]},
					title: {
						display: true,
						text: `Spectral Data For ${imageName}`,
						font: {
							size: 18
						}
					},
					decimation: {
						enabled: true,
					},
					legend: {
						display: false,
					},
				},
				hover: {
					mode: undefined,
				},
				scales: {
					x: {
						title: {
							display: true,
							text: "Wavelength (nm)"
						},
					},
					y: {
						title: {
							display: true,
							text: "Intensity (Counts)"
						}
					}
				},
				maintainAspectRatio: false,
				responsive: true,
			},
			data: {
				datasets: [ ...POINTS.map( point => ({
					label: 					'test',
					data: 					point.graphVals,
					'pointBorderWidth': 	0,
					pointBackgroundColor: 	'rgba(0, 0, 0, 0)',
					showLine: 				true,
					borderWidth: 			1,
					borderColor: 			point.color
				}))]
			}
		} as ChartConfiguration<"scatter">

		if(chart) {
			chart.clear();
			// @ts-ignore
			chart.options 	= options.options;
			chart.data 		= options.data;

			chart.update();
		} else {
			const newChart = new Chart(ctx, options)
			setChart(newChart);
		}

		setLoading(false);
	}, [ MANIFEST, settings.disabledPoints ])

	return (
		<div className="SpectralGraph">
			<canvas ref={canvas} />
		</div>
	)
}
