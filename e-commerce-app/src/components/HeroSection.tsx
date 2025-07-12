import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export const HeroSection = () => {
  return (
    <section className="relative h-[560px] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555529669-e69e7aa0ba9e?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
        >
          Find Your Style
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeInOut' }}
          className="mt-4 max-w-xl text-lg"
        >
          Discover the latest trends and find your perfect look. High-quality products, just for you.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeInOut' }}
          className="mt-8"
        >
          <Button size="lg">Shop Now</Button>
        </motion.div>
      </div>
    </section>
  );
};
