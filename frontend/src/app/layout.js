import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import { AppProvider } from './context/AppContext';

export const metadata = {
  title       : 'KTSHOP – Laptop Chính Hãng Giá Tốt',
  description : 'KTSHOP chuyên cung cấp laptop Dell, HP, Asus, Lenovo, Apple chính hãng. Giá tốt nhất, bảo hành uy tín, giao hàng toàn quốc.',
  icons       : {
    icon: '/sun-favicon.svg',
    shortcut: '/sun-favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body className="page-layout">
        <AppProvider>
          <Header />
          <main className="page-main">
            {children}
          </main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
