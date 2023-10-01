import './BeforeVsAfter.scss';
import { useEffect, useState }       from 'react';
import { Image, Manifest }           from '../../main/SampleParser';
import { Settings }                  from '../App';
import * as math                     from 'mathjs'

type Props = {
	imageName    : string
	setImageName : React.Dispatch<React.SetStateAction<string>>
	settings     : Settings
	setSettings  : React.Dispatch<React.SetStateAction<Settings>>
	MANIFEST     : Manifest | null
	IMAGE        : Image | null
	IMAGES       : Image[] | null
}

export default function BeforeVsAfter( { MANIFEST, IMAGES }: Props ) {
	const [ info 		, setInfo 	  ] = useState({
		allMean      : 0,
		preMean      : 0,
		postMean     : 0,
		NDPreMean    : 0,
		NDPosMean    : 0,
		notNDPreMean : 0,
		notNDPosMean : 0
	})

	useEffect(() => {

		if(IMAGES?.length === 0) return;

		let infoArrays = { allMean: [], preMean: [], postMean: [], NDPreMean: [], NDPosMean: [], notNDPreMean: [], notNDPosMean: []} as { [key in keyof typeof info]: number[]};

		MANIFEST?.forEach(data => {
			const imgName 	= data['Image Name'];
			const imgData 	= IMAGES?.find(img => img.name === imgName)?.data;

			if(!imgData) return;

			const isHydrog 	= data['Annealing H2 in N2 (%)'] !== 'None';
			const isDiamon 	= data["pointType"] === "Diamond";

			const flat 		= imgData.flat();

			if(!flat)		return;

			const mean 		= math.mean(flat);

			infoArrays.allMean.push(mean);

			if(isHydrog) infoArrays.postMean.push(mean);
			else 		 infoArrays.preMean.push(mean);

			if(isDiamon && isHydrog)  infoArrays.NDPosMean.push(mean);
			if(isDiamon && !isHydrog) infoArrays.NDPreMean.push(mean);

			if(!isDiamon && isHydrog)  infoArrays.notNDPosMean.push(mean);
			if(!isDiamon && !isHydrog) infoArrays.notNDPreMean.push(mean);
		});

		setInfo({
			allMean      : infoArrays.allMean.length 		> 0 && math.mean(infoArrays.allMean) 		|| 0,
			preMean      : infoArrays.preMean.length 		> 0 && math.mean(infoArrays.preMean) 		|| 0,
			postMean     : infoArrays.postMean.length 		> 0 && math.mean(infoArrays.postMean) 		|| 0,
			NDPreMean    : infoArrays.NDPreMean.length 		> 0 && math.mean(infoArrays.NDPreMean) 		|| 0,
			NDPosMean    : infoArrays.NDPosMean.length 		> 0 && math.mean(infoArrays.NDPosMean) 		|| 0,
			notNDPreMean : infoArrays.notNDPreMean.length 	> 0 && math.mean(infoArrays.notNDPreMean) 	|| 0,
			notNDPosMean : infoArrays.notNDPosMean.length 	> 0 && math.mean(infoArrays.notNDPosMean) 	|| 0
		})

	}, [ MANIFEST ])

	useEffect(() => {
		console.log(info);
	}, [info])

	return (
		<div className='BeforeVsAfter'>
			<div className='row'>
				<h4> Mean Brightness </h4>
				<h3> { info.allMean.toFixed(0) } </h3>
			</div>

			<div className='row'>
				<h4> Mean Brightness Before Hydrogenation </h4>
				<h3> { info.preMean.toFixed(0) } </h3>
			</div>

			<div className='row'>
				<h4> Mean Brightness After Hydrogenation </h4>
				<h3> { info.postMean.toFixed(0) } </h3>
			</div>

			<div className='row'>
				<h4> Mean Brightness of Diamonds Before Hydrogenation </h4>
				<h3> { info.NDPreMean.toFixed(0) } </h3>
			</div>

			<div className='row'>
				<h4> Mean Brightness of Diamonds After Hydrogenation </h4>
				<h3> { info.NDPosMean.toFixed(0) } </h3>
			</div>

			<div className='row'>
				<h4> Mean Brightness of Void Space before Hydrogenation </h4>
				<h3> { info.notNDPreMean.toFixed(0) } </h3>
			</div>

			<div className='row'>
				<h4> Mean Brightness of Void Space After Hydrogenation </h4>
				<h3> { info.notNDPosMean.toFixed(0) } </h3>
			</div>


		</div>
	)
}
