'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Chat App
        </Link>
        <div className="space-x-4">
          <Link 
            href="/" 
            className={`hover:text-blue-200 ${pathname === '/' ? 'underline' : ''}`}
          >
            Home
          </Link>
          <Link 
            href="/onesignal-test" 
            className={`hover:text-blue-200 ${pathname === '/onesignal-test' ? 'underline' : ''}`}
          >
            OneSignal Test
          </Link>
        </div>
      </div>
    </nav>
  );
}
