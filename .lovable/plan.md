

# Fix: Website URL missing protocol prefix

## Problem
When a handwerker's website is stored as `www.mhs-ht.ch` (without `https://`), `window.open()` treats it as a relative path, producing `https://bueeze.ch/www.mhs-ht.ch`.

## Fix
In `src/components/HandwerkerProfileModal.tsx` line 279, prepend `https://` if the URL doesn't already start with `http://` or `https://`:

```typescript
onClick={() => {
  const url = profile.website!.match(/^https?:\/\//) 
    ? profile.website! 
    : `https://${profile.website}`;
  window.open(url, '_blank');
}}
```

**1 file, 1 line change.**

