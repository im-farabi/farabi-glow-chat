
# Fix Publish URL Structure

## Current State (Already Working!)

The publishing system is **already implemented and working correctly**:

1. **Edge Function** (`publish-website/index.ts`): Saves websites to `user_websites` table with the slug
2. **Route** (`App.tsx` line 102): `/site/*` catches all published sites  
3. **Viewer** (`SiteView.tsx`): Fetches by slug and renders full-screen iframe

**Published websites are live at**: `farabi.me/site/{slug}`

## What Needs Fixing

### Issue 1: Confusing Prefix Options
The prefix dropdown (`#`, `/web/`, `/~/`, `/app/`) is misleading because ALL sites go to `/site/*` regardless of prefix choice. The prefix is stored in the slug but doesn't change the actual URL structure.

### Solution: Simplify to One URL Pattern

Since all sites go through `/site/*`, we should:
1. Remove the confusing prefix dropdown
2. Just show the actual URL pattern: `farabi.me/site/{slug}`
3. Keep it simple and honest

---

## File Changes

### File: `src/pages/WebGen.tsx`

**Change 1: Remove SLUG_PREFIXES (lines 207-212)**

Replace the complex prefix system with simple slug-only:
```typescript
// Remove SLUG_PREFIXES array entirely
// Remove slugPrefix state
```

**Change 2: Update Publish Dialog UI (around lines 1200-1230)**

Remove the prefix selector, just show:
```typescript
<Label>Your Website URL</Label>
<div className="flex items-center gap-2 bg-white/5 rounded-lg p-3">
  <span className="text-white/50">farabi.me/site/</span>
  <Input
    value={publishSlug}
    onChange={(e) => setPublishSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
    placeholder="my-awesome-site"
    className="flex-1 bg-transparent border-none"
  />
</div>
<p className="text-xs text-white/40">3-50 characters, lowercase letters, numbers, and hyphens only</p>
```

**Change 3: Update publish function (around lines 1160-1180)**

Remove prefix from the API call:
```typescript
const { data } = await supabase.functions.invoke('publish-website', {
  body: {
    title: publishTitle,
    slug: publishSlug, // Just the slug, no prefix
    html_content: generatedCode,
    anonymous_id: anonymousId
  }
});
```

### File: `supabase/functions/publish-website/index.ts`

**Simplify to remove prefix handling:**
- Remove prefix validation (lines 36-44)
- Use slug directly without prefix transformation
- Return `https://farabi.me/site/{slug}`

---

## Summary

| Component | Current | After Fix |
|-----------|---------|-----------|
| URL Format | `farabi.me/site/{prefix}/{slug}` | `farabi.me/site/{slug}` |
| Prefix Dropdown | 4 options (confusing) | Removed (simple) |
| Example URL | `farabi.me/site/web/ariyan` | `farabi.me/site/ariyan` |

---

## Result

After publishing, user gets a clean, working URL like:
- `https://farabi.me/site/ariyan`
- `https://farabi.me/site/my-portfolio`
- `https://farabi.me/site/cool-landing-page`

All websites are immediately live and accessible!
