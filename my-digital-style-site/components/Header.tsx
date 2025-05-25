/* "use client" */
import {useLocale, useTranslations, Link} from 'next-intl';
import {usePathname} from 'next/navigation';
import {useState} from 'react';
import Image from 'next/image';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const otherLocale = locale === 'ja' ? 'en' : 'ja';
  const switchHref = `/${otherLocale}${pathname.replace(/^\/([a-z]{2})/, '')}`;

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" locale={locale}>
          <Image src="/images/logo.svg" alt="Logo" width={120} height={28} priority />
        </Link>
        <button aria-label="Menu" className="md:hidden" onClick={() => setOpen(!open)}>
          ☰
        </button>
        <nav className={`${open ? 'block' : 'hidden'} md:flex gap-6 font-medium text-sm`}>
          <Link href="/" locale={locale}>{t('home')}</Link>
          <Link href="/#posts" locale={locale}>{t('posts')}</Link>
          <Link href="/about" locale={locale}>{t('about')}</Link>
          <Link href={switchHref} locale={otherLocale} className="underline">
            {t('language')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
