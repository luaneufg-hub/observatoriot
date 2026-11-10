import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-800.css';
import '@fontsource/lato/latin-400.css';
import '@fontsource/lato/latin-400-italic.css';
import '@fontsource/lato/latin-700.css';
import '@fontsource/lato/latin-900.css';
import './globals.css';

export const metadata = {
  title: 'Brasil · Observatório Setorial Territorial',
  description: 'Indicadores dos pequenos negócios por UF e município',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Adobe Fonts: proxima-nova + aktiv-grotesk (só carrega nos domínios autorizados no kit) */}
        <link rel="stylesheet" href="https://use.typekit.net/hpk7hne.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
