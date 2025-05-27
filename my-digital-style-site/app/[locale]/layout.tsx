import {NextIntlClientProvider} from 'next-intl';
import {metadata as baseMetadata} from '../layout-metadata';
import {getMessages, getLocale} from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '../globals.css';

export const metadata = baseMetadata;

export default async function LocaleLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+Mono:wght@400;700&display=swap"
        />
      </head>
      <body className="font-sans text-black bg-white">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
