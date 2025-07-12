import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { ProductSection } from '@/components/ProductSection';
import { Footer } from '@/components/Footer';

function App() {
  return (
    <div className="bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <ProductSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;