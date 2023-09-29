/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path                                  from 'path';
import { app, BrowserWindow, shell, screen } from 'electron';
import MenuBuilder                           from './menu';
import { resolveHtmlPath, timer }            from './util';
import SampleParser                          from './SampleParser';

declare global {
	var sampleParser: SampleParser
	var mainWindow: BrowserWindow;
}

const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(__dirname, '../../assets');
const ICON_PATH 	 = path.join(RESOURCES_PATH, ...'icon.png');


global.sampleParser	= new SampleParser();

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
if (isDebug) require('electron-debug')();

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};



const createWindow = async () => {

	// Begin by reading in the relevant data
	const { sampleParser } = global;
	sampleParser.loadManifest( path.resolve(__dirname, './Data/Post Hydrogenation Day 2') );


	const displays 			= screen.getAllDisplays()
	const externalDisplay 	= displays.find((display) => display.bounds.x !== 0 || display.bounds.y !== 0 );

	global.mainWindow = new BrowserWindow({
		show: false,
		width: 1190,
		height: 1080,
		x:	(externalDisplay?.bounds.x || 0),
		y:	(externalDisplay?.bounds.y || 0),
		icon: ICON_PATH,
		webPreferences: {
		  preload: app.isPackaged
			? path.join(__dirname, 'preload.js')
			: path.join(__dirname, '../../.erb/dll/preload.js'),
		},
	});

  	if (isDebug) await installExtensions();

	const { mainWindow } = global;

	mainWindow.flashFrame(false);
	mainWindow.loadURL(resolveHtmlPath('index.html'));

  	mainWindow.on('ready-to-show', async () => {
    	if (!mainWindow) throw new Error('"mainWindow" is not defined');
    	if (process.env.START_MINIMIZED) mainWindow.minimize();
		else {
			mainWindow.show();
			// mainWindow.webContents.closeDevTools();
		}
  	});

	mainWindow.on('closed', () => {
		// @ts-ignore
		global.mainWindow = null;
	});

	const menuBuilder = new MenuBuilder(mainWindow);
	menuBuilder.buildMenu();

	// Open urls in the user's browser
	mainWindow.webContents.setWindowOpenHandler((edata) => {
		shell.openExternal(edata.url);
		return { action: 'deny' };
	});

};

app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit() );

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => mainWindow === null && createWindow() );
  })
  .catch(console.log);
