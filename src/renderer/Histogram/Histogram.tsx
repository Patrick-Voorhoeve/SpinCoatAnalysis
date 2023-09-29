import './Histogram.scss';
import { Chart, registerables, ChartConfiguration }                  	from 'chart.js/auto';
import { useEffect, useRef, useState }           						from "react"
import { Settings }                                                  	from '../App';
import { Image, Manifest }                                           	from '../../main/SampleParser';

Chart.register(...registerables);


type Props = {
	imageName: 		string
	settings:		Settings
	MANIFEST:		Manifest | null
	IMAGE:			Image | null
}

export default function Histogram( { imageName, settings, MANIFEST, IMAGE }: Props ) {
	const [ chart, setChart   ] 	= useState(null as Chart | null);
	const [ loading, setLoading ]	= useState(true);
	const canvas 					= useRef( null as HTMLCanvasElement | null );

	useEffect(() => {
		setLoading(true);

		if(!IMAGE)		 	return;
		if(!MANIFEST)		return;

		const DATA 			= IMAGE.data;

		console.log(settings.maxValue);

		const maxData 		= settings.maxValue * 1000;

		const data 			= DATA.flat().filter(v => v < maxData);

		const binSize		= 500;
		const bins 			= [] as number[];

		data.forEach(value => {
			const bin = Math.trunc(value / binSize);
			bins[bin] = !bins[bin] ? 1 : bins[bin] + 1;
		})

		if(!canvas.current) return console.log("Could not find canvas ref");
		const ctx 			= canvas.current?.getContext("2d");
		if(!ctx) 		  	return console.log("Could not find canvas context");

		const options		= {
			type: 'bar',
			options: {
				plugins: {
					legend: {
						display: false,
					},
				},
				maintainAspectRatio: false,
				responsive: true,
				scales: {
					y: {
						display: false,
					},
					x: {
						ticks: {
							minRotation: 90,
							maxRotation: 90
						}
					}
				}
			},
			data: {
				labels: bins.map((b, i) => `${i * binSize }-${(i * binSize) + binSize }`),
				datasets: [{
					data: bins,
					backgroundColor: bins.map((b, i) => (i * binSize > settings.maxValue) || (i * binSize < settings.minValue) ? '#FFFFFF22' : '#FFFFFF'),
					barPercentage: 0.98,
					categoryPercentage: 1,
					borderWidth: 0
				}]
			}
		} as ChartConfiguration<"bar">;

		if(chart) {
			chart.clear();

			console.log("Here");

			chart.options 	= {
				...options.options,
				animation: {
					duration: 0,
				}
			};

			chart.data 		= options.data;

			chart.update();
		}

		else {
			const newChart = new Chart(ctx, options );
			setChart(newChart);
		}

		setLoading(false);

	}, [ IMAGE, settings ])

	return (
		<div className={`Histogram ${loading ? 'loading' : ''}`}>
			<canvas ref={ canvas } />
		</div>
	)
}
