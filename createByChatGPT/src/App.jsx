import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import "./App.css";

function App() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);

  // Lock body scroll when menu open (mobile UX)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [open]);

  const navItems = [
    { href: "#home", label: "ホーム" },
    { href: "#services", label: "サービス" },
    { href: "#solutions", label: "課題解決" },
    { href: "#cases", label: "導入事例" },
    { href: "#about", label: "会社概要" },
    { href: "#contact", label: "お問い合わせ" },
  ];

  return (
    <main className="font-sans text-gray-800 bg-white scroll-smooth">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#home" className="text-xl font-bold text-indigo-600 tracking-wide">
            Sample&nbsp;Pharmaceutical&nbsp;Inc.
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex space-x-6">
            {navItems.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium hover:text-indigo-600 transition-colors"
              >
                {label}
              </a>
            ))}
            <a
              href="#download"
              className="ml-4 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors"
            >
              資料請求
            </a>
          </nav>

          {/* Mobile hamburger */}
          <button
            aria-label="Toggle navigation"
            onClick={toggle}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-6 py-4 space-y-4">
              {navItems.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={toggle}
                  className="block text-gray-700 font-medium hover:text-indigo-600"
                >
                  {label}
                </a>
              ))}
              <a
                href="#download"
                onClick={toggle}
                className="block w-full text-center px-4 py-2 rounded-2xl bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700"
              >
                資料請求
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden pt-24 pb-32 bg-gradient-to-br from-indigo-50 to-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            テクノロジーとクリエイティビティで<br className="hidden md:block" />
            ビジネス課題を解決します
          </h1>
          <p className="mt-6 text-lg text-gray-700 max-w-2xl mx-auto">
            業務効率化からブランド力向上まで、企業成長を加速させるソリューションをワンストップで提供。
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <a
              href="#contact"
              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition-colors"
            >
              相談する
            </a>
            <a
              href="#services"
              className="px-6 py-3 rounded-2xl border border-indigo-600 text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors"
            >
              サービスを見る
            </a>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            課題解決
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "業務効率化", desc: "ルーチンワークを自動化し、創造的な業務に集中。" },
              { title: "コスト削減", desc: "クラウド導入とプロセス最適化で運用コストを削減。" },
              { title: "新規顧客獲得", desc: "デジタルマーケティングで新しい顧客層を開拓。" },
              { title: "ブランド力向上", desc: "一貫したブランドデザインで認知度と評価を向上。" },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow bg-gray-50"
              >
                <h3 className="text-lg font-semibold text-indigo-600 mb-2">
                  {title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            サービス内容
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "システム開発",
                desc: "最新技術でビジネスに最適なシステムを構築。",
              },
              {
                title: "Webサイト制作",
                desc: "企業の顔となるサイトをデザインから運用までサポート。",
              },
              {
                title: "マーケティング支援",
                desc: "データ分析に基づいた戦略で成果を最大化。",
              },
              {
                title: "コンサルティング",
                desc: "豊富な経験でビジネス成長を戦略面からサポート。",
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-indigo-600 mb-2">
                  {title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA – Download brochure */}
      <section id="download" className="py-24 bg-indigo-600 relative">
        <div className="absolute inset-0 bg-[url('https://source.unsplash.com/twukN12EN7c/1920x1080')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-6">
            さらに詳しい資料をダウンロード
          </h2>
          <p className="text-indigo-100 max-w-xl mx-auto mb-8">
            事例やサービス詳細をまとめたPDF資料を無料でご提供しています。
          </p>
          <a
            href="#contact"
            className="px-8 py-4 rounded-2xl bg-white text-indigo-600 font-semibold shadow-lg hover:bg-gray-100 transition-colors"
          >
            資料請求フォームへ
          </a>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            お問い合わせ
          </h2>
          <p className="text-gray-700 max-w-xl mx-auto mb-8">
            ご相談やお見積もり依頼など、お気軽にお問い合わせください。
          </p>
          <a
            href="mailto:info@example.com"
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition-colors"
          >
            メールを送る
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Sample Pharmaceutical Inc. All rights reserved.</p>
          <nav className="flex gap-4">
            <a href="#privacy" className="hover:text-gray-700">プライバシーポリシー</a>
            <a href="#terms" className="hover:text-gray-700">利用規約</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

export default App
