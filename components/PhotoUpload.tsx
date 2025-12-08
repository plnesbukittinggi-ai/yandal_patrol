import React, { useRef } from 'react';

interface PhotoUploadProps {
  label: string;
  imageSrc: string | null;
  onImageChange: (file: File) => void;
  id: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ label, imageSrc, onImageChange, id }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageChange(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div 
        className={`relative w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer overflow-hidden transition-colors ${
          imageSrc ? 'border-primary' : 'border-slate-300 hover:bg-slate-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        {imageSrc ? (
          <img src={imageSrc} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs text-slate-500">Klik untuk ambil/upload foto</span>
          </div>
        )}
        <input 
          ref={fileInputRef}
          id={id}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};