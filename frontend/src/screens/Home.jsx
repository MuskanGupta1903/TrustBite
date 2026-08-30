import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import FeedCard from '../components/FeedCard';
import StatCard from '../components/StatCard';
import CategorySelector from '../components/CategorySelector';
import BottomNav from '../components/BottomNav';
import { Upload } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('dairy');

  return (
    <div className="min-h-screen font-body pb-32 bg-[url('/home-bg.png')] bg-cover bg-center bg-fixed bg-no-repeat">
      <div className="max-w-5xl mx-auto p-6 flex flex-col relative z-10">
        <Header />
        
        {/* Bento Grid */}
        <div 
          className="grid gap-6 mb-8"
          style={{
            gridTemplateColumns: '2fr 1fr',
            gridTemplateRows: 'auto auto',
            gridTemplateAreas: `
              "feed stat"
              "feed cat"
            `
          }}
        >
          <div style={{ gridArea: 'feed' }} className="h-[432px]">
            <FeedCard />
          </div>
          <div style={{ gridArea: 'stat' }} className="h-[200px]">
            <StatCard />
          </div>
          <div style={{ gridArea: 'cat' }} className="h-[208px]">
            <CategorySelector selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>
        </div>

        {/* Upload Button */}
        <div className="fixed bottom-24 left-0 right-0 px-6 flex justify-center z-40 pointer-events-none">
          <button 
            onClick={() => navigate(`/scan?category=${selectedCategory}`, { state: { category: selectedCategory } })}
            className="w-full max-w-sm bg-primary text-white font-heading font-bold text-lg py-4 px-6 rounded-2xl shadow-xl hover:bg-primary/90 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform pointer-events-auto"
          >
            <Upload className="w-5 h-5" />
            Upload photo
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
