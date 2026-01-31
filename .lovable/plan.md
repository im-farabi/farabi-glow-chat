

# Auto-Upload Images to Supabase Storage

## Summary
When a user uploads an image (drag/drop/paste/click), automatically upload it to the existing `video-temp-images` Supabase storage bucket and get a public URL. This URL gets passed to the Pollinations API instead of base64.

---

## Current Flow (Broken)

```text
User uploads image
       │
       ▼
Convert to base64
       │
       ▼
Pass base64 to API ❌ (API rejects - needs URL)
```

## New Flow (Fixed)

```text
User uploads image
       │
       ▼
Upload to Supabase Storage (video-temp-images bucket)
       │
       ▼
Get public URL
       │
       ▼
Pass URL to API ✅
```

---

## Changes Required

### 1. Update `src/pages/ImageGen.tsx`

**Add new state:**
```typescript
const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
const [isUploading, setIsUploading] = useState(false);
```

**Update `handleFileUpload` function:**
```typescript
const handleFileUpload = useCallback(async (file: File) => {
  // Validate file
  if (!file.type.startsWith('image/')) return;
  if (file.size > 10 * 1024 * 1024) return;

  setIsUploading(true);
  
  // Show preview immediately (base64 for UI only)
  const reader = new FileReader();
  reader.onload = (e) => setUploadedImage(e.target?.result as string);
  reader.readAsDataURL(file);

  try {
    // Upload to Supabase Storage
    const fileName = `img-ref-${Date.now()}-${Math.random().toString(36).slice(2)}.${file.type.split('/')[1]}`;
    
    const { data, error } = await supabase.storage
      .from('video-temp-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('video-temp-images')
      .getPublicUrl(fileName);

    setUploadedImageUrl(urlData.publicUrl);
    toast({ title: 'Image uploaded', description: 'Reference image ready' });
  } catch (err) {
    toast({ title: 'Upload failed', description: 'Could not upload image', variant: 'destructive' });
  } finally {
    setIsUploading(false);
  }
}, [toast]);
```

**Update API calls to use `uploadedImageUrl`:**
```typescript
// In generateImages() and regenerateSingle()
imageUrl: uploadedImageUrl || undefined,  // Use public URL, not base64
```

**Update clear image function:**
```typescript
const clearUploadedImage = () => {
  setUploadedImage(null);
  setUploadedImageUrl(null);
};
```

**Add loading indicator during upload:**
```typescript
{isUploading && (
  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
    <Loader2 className="w-8 h-8 animate-spin text-green-400" />
  </div>
)}
```

### 2. Add Model Name to Image Cards

**Update `GeneratedImage` interface:**
```typescript
interface GeneratedImage {
  id: number;
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
  seed: number;
  modelName: string;  // Add this
}
```

**Update initialization in `generateImages`:**
```typescript
const modelInfo = MODELS.find(m => m.id === selectedModel);
const initialImages: GeneratedImage[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  imageUrl: null,
  loading: true,
  error: null,
  seed: Math.floor(Date.now() % 1000000) + i * 1000,
  modelName: modelInfo?.name || selectedModel
}));
```

**Update card overlay to show model name:**
```typescript
<p className="text-xs text-white/70 text-center">{img.modelName}</p>
// Instead of: Image #{img.id + 1}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ImageGen.tsx` | Add auto-upload to storage, use public URL for API, show model names on cards |

---

## Summary of Benefits

1. User drags/drops/pastes an image
2. Shows preview immediately (base64 for UI)
3. Uploads to Supabase in background
4. Gets public URL automatically
5. API receives valid URL - no more errors
6. Each image card shows which model made it

