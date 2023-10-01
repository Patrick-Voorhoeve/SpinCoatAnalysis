import './Histogram.scss';
import { Chart, registerables, ChartConfiguration }                  	from 'chart.js/auto';
import { useEffect, useRef, useState }           						from "react"
import { Settings }                                                  	from '../App';
import { Image, Manifest }                                           	from '../../main/SampleParser';
import { siRound } 														from '../Helpers/Methods';
import * as math 														from 'mathjs';

Chart.register(...registerables);


type Props = {
	imageName: 		string
	settings:		Settings
	MANIFEST:		Manifest | null
	IMAGE:			Image | null
}

export default function Histogram( { imageName, settings, MANIFEST, IMAGE }: Props ) {
	const [ chart, setChart   ]      = useState(null as Chart | null);
	const [ loading, setLoading ]    = useState(true);
	const [ mean   , setMean 	]    = useState(0);
	const [ std    , setSTD 	]    = useState(0)
	const canvas                     = useRef( null as HTMLCanvasElement | null );

	useEffect(() => {
		setLoading(true);

		if(!IMAGE)		 	return;
		if(!MANIFEST)		return;

		const DATA       	= IMAGE.data.map( row => row.map(val => val > settings.truncMax ? null : val).map(val => (val && val < settings.truncMin) ? null : val ) );
		const data       	= DATA.flat().filter(v => v !== null).filter(v => v && v < settings.truncMax) as number[];

		if(data.length === 0) return;

		setMean(Number(math.mean(data)))
		setSTD(Number(math.std(data)));

		const binSize    	= 500;
		const bins       	= [] as number[];

		data.forEach(value => {
			const bin = Math.trunc(value / binSize);
			bins[bin] = !bins[bin] ? 1 : bins[bin] + 1;
		})

		const dataMax		= math.max(bins.filter(b => !!b));
		const meanBinX 		= bins.findIndex((val, i) => i * binSize > (mean - binSize) && i * binSize < (mean + binSize) );
		const stdMinX 		= bins.findIndex((val, i) => i * binSize > (mean - std - binSize) && i * binSize < (mean - std + binSize) );
		const stdMaxX 		= bins.findIndex((val, i) => i * binSize > (mean + std - binSize) && i * binSize < (mean + std + binSize) );

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
					annotation: {
						annotations: [
							{
								type: 'line',
								xMin: meanBinX,
								xMax: meanBinX,
								borderColor: '#f33',
								drawTime: 'beforeDatasetsDraw',
							},
							{
								type: 'line',
								xMin: stdMinX,
								xMax: stdMinX,
								borderColor: '#36f',
								drawTime: 'beforeDatasetsDraw',
							},
							{
								type: 'line',
								xMin: stdMaxX,
								xMax: stdMaxX,
								borderColor: '#36f',
								drawTime: 'beforeDatasetsDraw',
							},
						]
					}
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
				labels: bins.map((b, i) => `${ siRound(i * binSize) }`),
				datasets: [{
					data: bins,
					backgroundColor: bins.map((b, i) => (i * binSize > settings.maxValue) || (i * binSize < settings.minValue) ? '#FFFFFF22' : '#FFFFFF'),
					barPercentage: 0.98,
					categoryPercentage: 1,
					borderWidth: 0,
				}]
			}
		} as ChartConfiguration<"bar">;

		if(chart) {
			chart.clear();

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

	}, [ IMAGE, settings, mean ])

	return (
		<div className={`Histogram ${loading ? 'loading' : ''}`}>
			<div className='info'>
				<p className='red'> μ = {siRound(mean)} </p>
				<p className='blue'> σ = {siRound(std)} </p>
			</div>
			<canvas ref={ canvas } />
		</div>
	)
}
