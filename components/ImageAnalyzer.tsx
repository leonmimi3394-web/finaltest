import React, { useState } from 'react';
import { analyzeImage } from '../services/geminiService';
import { Upload, Image as ImageIcon, CheckCircle, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const ImageAnalyzer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResult('');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !preview) return;

    setLoading(true);
    
    // Extract base64 data (remove "data:image/jpeg;base64," prefix)
    const base64Data = preview.split(',')[1];
    const mimeType = selectedFile.type;
    
    const analysis = await analyzeImage(
      base64Data, 
      mimeType, 
      "Identify the object in this image. If it is a bulb, check for visible damage. If it is a document/receipt, extract the key numbers and totals. Provide business advice if relevant."
    );

    setResult(analysis);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Smart Image Analyzer</h2>
        <p className="text-gray-500 mb-6">Upload photos of invoices, damaged bulbs, or inventory to get instant AI insights.</p>

        <div className="flex flex-col items-center gap-6">
          <label className="w-full max-w-md h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition relative overflow-hidden">
            {preview ? (
              <img src={preview} alt="Preview" className="h-full w-full object-contain" />
            ) : (
              <>
                <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full mb-3">
                  <Upload size={32} />
                </div>
                <span className="text-gray-500 font-medium">Click to upload image</span>
                <span className="text-gray-400 text-sm mt-1">JPG, PNG supported</span>
              </>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>

          <button 
            onClick={handleAnalyze}
            disabled={!selectedFile || loading}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
          >
            {loading ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                Analyzing...
              </>
            ) : (
              <>
                <ImageIcon size={20} /> Analyze Image
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-slide-up">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="text-green-500" size={24} />
            Analysis Result
          </h3>
          <div className="prose prose-indigo max-w-none text-gray-700 bg-gray-50 p-6 rounded-lg">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
