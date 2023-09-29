import '@mantine/core/styles.css';
import { createRoot }      from 'react-dom/client';
import App                 from './App';
import { MantineProvider } from '@mantine/core';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
	<MantineProvider>
		<App />
	</MantineProvider>
);

