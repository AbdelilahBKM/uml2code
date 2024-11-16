"use client";
import { usePathname } from 'next/navigation'; 
import Navbar from '@/components/navbar';
import { store } from './redux'
import { Provider } from 'react-redux'
import Footer from '@/components/footer';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname(); 

  const isEditPage = pathname?.includes("my-diagrams/edit");
    return (
        <Provider store={store}>
            {!isEditPage && <Navbar />}
            <main className="flex-grow  bg-gradient-to-br from-background to-secondary/20">
                {children}
            </main>
            {!isEditPage && <Footer />}
        </Provider>
    );
};