
import React, { useState } from 'react';
import { geminiService } from '../services/gemini';
import { GeneratedImage } from '../types';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const url = await geminiService.generateImage(prompt);
      setImages(prev => [{ id: Date.now().toString(), url, prompt }, ...prev]);
      setPrompt('');
    } catch (err) {
      alert('Failed to generate image. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full p-4 md:p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold mb-2 text-center">Creative <span className="gradient-text">Canvas</span></h2>
        <p className="text-slate-400 text-center mb-8">Transform your ideas into stunning visuals using Gemini 2.5 Flash Image.</p>
        
        <div className="glass p-2 rounded-2xl flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="A futuristic city with flying neon cars, digital art style..."
            className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-white"
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 px-8 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                <span>Generate</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((img) => (
          <div key={img.id} className="group relative overflow-hidden rounded-2xl bg-slate-800 border border-slate-700 aspect-square shadow-2xl transition-all hover:scale-[1.02]">
            <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
              <p className="text-sm text-white font-medium line-clamp-2">{img.prompt}</p>
              <div className="flex space-x-2 mt-2">
                <a 
                  href={img.url} 
                  download={`gemini-gen-${img.id}.png`}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-lg text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <svg className="w-20 h-20 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p>Your generated masterpieces will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default ImageView;
