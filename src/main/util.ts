/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path    from 'path';
import chalk   from 'chalk';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export const timer = async (ms: number) => await new Promise(( resolve ) => setTimeout(resolve, ms));


export const green 	= ( message: string ) => console.log(chalk.green(message));
export const blue  	= ( message: string ) => console.log(chalk.blue(message));
export const pink  	= ( message: string ) => console.log(chalk.magenta(message));
export const yellow = ( message: string ) => console.log(chalk.yellow(message));
export const red 	= ( message: string ) => console.log(chalk.red(message));
export const grey 	= ( message: string ) => console.log(chalk.grey(message));
export const loader = ( message: string, color: typeof green = green ) => color(`${message}\r`);

