

# Fix: Add "Admin-Bereich" Link to UserDropdown for Admins

## Problem
When an admin is logged in and on the public front page, clicking the avatar only shows "Abmelden" (and client/handwerker nav items). There is no link to the admin area (`/admin/dashboard`), so the admin has no way to get there without typing the URL.

## Fix (1 file)

**`src/components/UserDropdown.tsx`**

Add a conditional "Admin-Bereich" menu item for admin users, placed before the other nav items with a separator:

```tsx
{isAdmin && (
  <>
    <DropdownMenuItem onClick={() => navigate('/admin/dashboard')} className="cursor-pointer">
      <Shield className="mr-2 h-4 w-4 text-red-600" />
      <span>Admin-Bereich</span>
    </DropdownMenuItem>
    <DropdownMenuSeparator className="bg-line-200" />
  </>
)}
```

Import `Shield` from lucide-react. Single file, ~6 lines added.

