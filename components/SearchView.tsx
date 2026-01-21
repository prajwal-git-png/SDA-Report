
import React, { useState } from 'react';
import { geminiService } from '../services/gemini';
import { SearchResult } from '../types';

const SearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{ text: string; sources: SearchResult[] } | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await geminiService.searchGrounding(query);
      setResponse(result);
    } catch (err) {
      alert('Search failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full p-4 md:p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl font-bold mb-2 text-center">Deep <span className="gradient-text">Search</span></h2>
        <p className="text-slate-400 text-center mb-8">Access real-time information with Google Search grounding powered by Gemini 3 Flash.</p>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Current gold price in 2025, top tech news today..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white shadow-xl"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 px-6 py-4 rounded-2xl font-bold text-white transition-all shadow-xl"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {response && (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass p-8 rounded-3xl space-y-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-blue-400">Synthesized Answer</h3>
            <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
              {response.text}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              <span>Sources & References</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {response.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block glass p-4 rounded-2xl hover:bg-slate-800/80 transition-all border-l-4 border-blue-500"
                >
                  <p className="font-medium text-slate-100 mb-1 line-clamp-1">{source.title}</p>
                  <p className="text-xs text-blue-400 truncate">{source.uri}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {!response && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <svg className="w-20 h-20 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <p>Search the web with Gemini's intelligence.</p>
        </div>
      )}
    </div>
  );
};

export default SearchView;
