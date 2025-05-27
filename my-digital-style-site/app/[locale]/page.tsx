import {useTranslations} from 'next-intl';

export default function Home() {
  const t = useTranslations('hero');
  return (
    <section className="py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">{t('welcome')}</h1>
      <img src="/images/sample-hero.jpg" alt="Hero" className="mx-auto" />
    </section>
  );
}
