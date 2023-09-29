// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent }                       from 'electron';
import { CSVData, SPECTRALDATA }                                              from './DataParser';
import { Image, Manifest, PointInfo }                                         from './SampleParser';

export type Channels = 'ipc-example';

const electronHandler = {
	getManifest: async () => {
		const data = await ipcRenderer.invoke('getManifest') as Manifest;

		return data;
  	},

	  getImage: async ( imageName: string ) => {
		const data = await ipcRenderer.invoke('getImage', imageName ) as Image;

		return data;
  	}

};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
