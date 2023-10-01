import fs 				from 'fs';
import FS 				from 'fs/promises';
import { parse } 		from 'csv-parse';
import path 			from 'path';
import { blue, green, pink, red } from './util';
import { ipcMain }                from 'electron';

export default class SampleParser {

	manifest = [] as {
		"Sample Name": 					string
		"Image Name": 					string
		"Description": 					string
		"Notes": 						string
		"Power (μW)": 					number
		"Exposure Time (s)": 			string
		"Center Wavelength (nm)": 		number
		"Filter": 						string
		"Starting Z (μm)": 				number
		"Centre X (μm)": 				number
		"Centre Y (μm)": 				number
		"Range X(μm)": 					number
		"Range Y (μm)": 				number
		"# Pixels X": 					number
		"# Pixels Y": 					number
		"Offset X (μm)": 				number
		"Offset Y (μm)": 				number
		"Pixel Time (ms)": 				number
		"Start X (μm)": 				number
		"End X (μm)": 					number
		"Start Y (μm)": 				number
		"End Y (μm)": 					number
		"Pixels / μm (X)": 				number
		"Pixels / μm (Y)": 				number
		"pointName": 					string
		"pointFile": 					string
		"wavelengths": 					number[]
		"values":						number[]
		"graphVals":					{ x: number, y: number }[]
		"index":						number
		"imageIndex":					number
		"xPosition":					number
		"yPosition":					number
		"zPosition":					number
		"counts":						number
		"color":						string
		"Annealing Temp (C)":			number | "None"
		"Annealing H2 in N2 (%)":		string
		"pointType":					"Diamond" | "Void" | "Interest"

	}[]

	images	 = [] as {
		name:			string,
		data:			number[][],
	}[]

	constructor() {
		ipcMain.removeHandler('getManifest');
		ipcMain.handle('getManifest', ( _ev ) => this.manifest );

		ipcMain.removeHandler('getImage');
		ipcMain.handle('getImage', ( _ev, imageName: string ) => this.images.find( img => img.name === imageName ) );

		ipcMain.removeHandler('getAllImages');
		ipcMain.handle('getAllImages', (_ev) => this.images);
	}

	loadManifest = async ( DATA_FOLDER_PATH: string ) => {

		// Find and parse the manifest JSON file.
		const dataFolder 			= path.resolve(DATA_FOLDER_PATH);
		const manifestPath 			= path.resolve(`${DATA_FOLDER_PATH}/Sample_Manifest.json`);
		const manifestJSON 			= await FS.readFile(manifestPath);
		if(!manifestJSON) 			return red("Could not find manifest JSON");
		const manifest 				= JSON.parse(String(manifestJSON)) as Manifest;
		const images 				= [] as Images;

		// For every point in the manifest, load the image into the manifest data.
		manifest.forEach( async (point, idx) => {
			const imageName			= point['Image Name'];

			const imageLoaded 		= this.images.findIndex(v => v.name === imageName) !== -1;

			if(imageLoaded) 		return;

			const imageBuffer		= await FS.readFile(`${dataFolder}/${imageName}/${imageName}.txt`);
			const imgStr			= String(imageBuffer).split('\n').map(row => row.split('\t'));

			const lastHeaderIdx		= imgStr.findIndex(row => row[0] === '[Data]');
			const img 				= imgStr.slice(lastHeaderIdx + 1).map(row => row.map(v => parseFloat(v))).filter(v => !!v[0] && !isNaN(v[0]));

			images.push({ name: imageName, data: img });
			manifest[idx].imageIndex = this.images.length - 1;
		})

		this.images					= images;
		this.manifest				= manifest;

		return this.manifest;
	}
}

export type Manifest 	= SampleParser["manifest"];
export type PointInfo	= Manifest[number];
export type Images 		= SampleParser["images"];
export type Image 		= Images[number];
