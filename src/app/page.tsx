'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 flex justify-end">
        <Button asChild variant="ghost">
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
      </header>
      <main className="flex-grow flex items-center justify-center text-center p-4">
        <div className="flex flex-col items-center gap-8">
          <Image
            src="https://marketplace.nortedato.cl/wp-content/uploads/2025/10/Logo-Nortedatocl-General-trans.png"
            alt="Logo de Nortedato.cl"
            width={150}
            height={150}
            className="object-contain"
          />

          <div className="flex flex-col items-center gap-2">
             <h1 className="text-5xl font-headline tracking-tight text-foreground">
                MultiPostFlow
             </h1>
             <div className="flex items-center gap-2">
                <span className="text-muted-foreground">by</span>
                <Image
                    src="https://emprendedores.app/wp-content/uploads/2025/10/Logo-HipeFLow-Banner.png"
                    alt="Logo de HiperFlow"
                    width={100}
                    height={40}
                    className="object-contain"
                />
             </div>
          </div>


          <p className="max-w-xl text-lg text-muted-foreground">
            La plataforma inteligente para crear, adaptar y distribuir tu contenido en todas tus redes y plataformas con el poder de la IA.
          </p>

          <Button asChild size="lg">
            <Link href="/login">
              Comienza a Publicar <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
