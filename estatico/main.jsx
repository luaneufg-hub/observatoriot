// Versão estática da página (sem servidor): os mesmos componentes do app Next.js,
// empacotados pelo Vite. Útil para pré-visualização e para hospedar em qualquer servidor de arquivos.
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-800.css';
import '@fontsource/lato/latin-400.css';
import '@fontsource/lato/latin-400-italic.css';
import '@fontsource/lato/latin-700.css';
import '@fontsource/lato/latin-900.css';
import '../app/globals.css';
import { createRoot } from 'react-dom/client';
import Raiz from '@/components/Raiz';

createRoot(document.getElementById('raiz')).render(<Raiz />);
