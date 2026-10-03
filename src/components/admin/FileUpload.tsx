import { useState, useRef } from 'react';
import { Upload, Loader2, X, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FileUploadProps {
  value: string | null;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  folder?: string;
  className?: string;
}

export default function FileUpload({
  value,
  onChange,
  label = 'Upload Image',
  accept = 'image/*',
  folder = 'general',
  className = '',
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.');
      return;
    }
    setUploading(true);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setError('Could not upload file. Please try again.');
      console.error('Upload error:', uploadError);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
    onChange(urlData.publicUrl);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}

      {value ? (
        <div className="relative group">
          <img src={value} alt="Uploaded preview" className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-slate-50" />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-sm text-sky-600 hover:text-sky-700 font-medium"
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/50 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
              <span className="text-sm text-slate-500">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="bg-slate-100 p-3 rounded-full">
                <Upload className="w-5 h-5 text-slate-400" />
              </div>
              <span className="text-sm text-slate-600 font-medium">Click to upload or drag & drop</span>
              <span className="text-xs text-slate-400">PNG, JPG, SVG up to 5MB</span>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
