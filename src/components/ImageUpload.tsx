import React, { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";

const IMGBB_API_KEY = "03183c8a5d143efd2444bc83fc670ded";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

const uploadToImgbb = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("key", IMGBB_API_KEY);
  const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!data.success) throw new Error("Upload failed");
  return data.data.url;
};

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, placeholder = "Upload image" }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToImgbb(file);
      onChange(url);
    } catch {
      alert("Image upload failed. Try again.");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative inline-block">
          <img src={value} alt="preview" className="w-20 h-20 rounded-lg object-cover border border-border" />
          <button type="button" onClick={() => onChange("")} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
            <X size={12} />
          </button>
        </div>
      )}
      <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-border rounded-lg text-sm text-muted-foreground cursor-pointer hover:border-foreground hover:text-foreground transition-colors">
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {uploading ? "Uploading..." : placeholder}
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
      </label>
    </div>
  );
};

export default ImageUpload;

export const MultiImageUpload: React.FC<{ values: string[]; onChange: (urls: string[]) => void; placeholder?: string }> = ({ values, onChange, placeholder = "Add screenshots" }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadToImgbb(file);
        urls.push(url);
      }
      onChange([...values, ...urls]);
    } catch {
      alert("Some images failed to upload.");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (i: number) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {values.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {values.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
              <button type="button" onClick={() => removeAt(i)} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-border rounded-lg text-sm text-muted-foreground cursor-pointer hover:border-foreground hover:text-foreground transition-colors">
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {uploading ? "Uploading..." : placeholder}
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" disabled={uploading} />
      </label>
    </div>
  );
};
