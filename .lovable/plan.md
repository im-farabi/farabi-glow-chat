
# GitHub Authentication & Credit System for /web

## Overview

Implement a GitHub-only authentication system specifically for the `/web` (WebGen) page with a credit-based pricing system:

| Model | Cost per Generation |
|-------|---------------------|
| Claude | $1.00 |
| GPT 5.2 | $1.50 |
| Qwen Coder | $0.50 |

New users receive **$5.00 free credits** upon registration.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         User Flow                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /web page → Check Auth → Not logged in? → Show Login Gate          │
│                  │                              │                    │
│                  ▼                              ▼                    │
│           Get user credits            GitHub OAuth Login             │
│                  │                              │                    │
│                  ▼                              ▼                    │
│          Check balance ≥ cost         Create user + $5 credits       │
│                  │                              │                    │
│                  ▼                              ▼                    │
│          Allow generation             Redirect back to /web          │
│                  │                                                   │
│                  ▼                                                   │
│          Deduct credits on success                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### 1. User Credits Table

```sql
create table public.user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  balance decimal(10,2) not null default 5.00,
  total_spent decimal(10,2) not null default 0.00,
  total_generations integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_credits enable row level security;

-- Users can read their own credits
create policy "Users can view own credits"
on public.user_credits for select
to authenticated
using (auth.uid() = user_id);

-- Create index for faster lookups
create index idx_user_credits_user_id on public.user_credits(user_id);
```

### 2. Generation History Table (for tracking)

```sql
create table public.webgen_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  model text not null,
  cost decimal(10,2) not null,
  prompt text,
  success boolean default true,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.webgen_history enable row level security;

-- Users can view their own history
create policy "Users can view own history"
on public.webgen_history for select
to authenticated
using (auth.uid() = user_id);

-- Create index
create index idx_webgen_history_user_id on public.webgen_history(user_id);
```

### 3. Trigger for New User Credits

```sql
-- Function to create credits for new users
create or replace function public.handle_new_user_credits()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_credits (user_id, balance)
  values (new.id, 5.00)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Trigger on auth.users
create trigger on_auth_user_created_credits
  after insert on auth.users
  for each row execute procedure public.handle_new_user_credits();
```

---

## Implementation Files

### 1. Auth Context (`src/contexts/AuthContext.tsx`)

New file providing authentication state and methods:
- `user` - Current Supabase user
- `session` - Current session
- `credits` - User's current balance
- `loading` - Auth loading state
- `signInWithGitHub()` - Initiate GitHub OAuth
- `signOut()` - Log out user
- `refreshCredits()` - Fetch latest balance

### 2. Auth Hook (`src/hooks/useWebGenAuth.ts`)

Custom hook specifically for WebGen:
- Check if user is authenticated
- Fetch user credits
- Validate sufficient balance for model
- Deduct credits after successful generation

### 3. Login Gate Component (`src/components/webgen/LoginGate.tsx`)

Full-page overlay shown to unauthenticated users:
- Premium design matching WebGen aesthetic
- GitHub OAuth button
- Feature highlights (free $5, per-model pricing)
- Smooth animations

### 4. Credits Display (`src/components/webgen/CreditsDisplay.tsx`)

Header component showing:
- Current balance with icon
- User avatar from GitHub
- Logout button

### 5. Edge Function Update (`supabase/functions/web-gen/index.ts`)

Add authentication and credit deduction:
- Verify JWT token
- Check user has sufficient credits
- Deduct credits on successful generation
- Log generation to history table

---

## Updated WebGen.tsx Flow

```typescript
// Simplified auth flow in WebGen.tsx

const WebGen = () => {
  const { user, credits, loading } = useWebGenAuth();
  
  // Show login gate if not authenticated
  if (!loading && !user) {
    return <LoginGate />;
  }
  
  // Check credits before generation
  const handleStartGeneration = async () => {
    const cost = MODEL_COSTS[selectedModel]; // { claude: 1.00, gpt: 1.50, qwen: 0.50 }
    
    if (credits < cost) {
      toast({
        title: "Insufficient credits",
        description: `You need $${cost.toFixed(2)} but only have $${credits.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }
    
    // Proceed with generation (credits deducted server-side)
    await generateWebsite(enhancedPrompt);
  };
  
  return (
    <div>
      <Header>
        <CreditsDisplay balance={credits} user={user} />
      </Header>
      {/* Rest of WebGen UI */}
    </div>
  );
};
```

---

## Edge Function Auth Flow

```typescript
// In supabase/functions/web-gen/index.ts

// Get user from JWT
const authHeader = req.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');

const { data: { user }, error } = await supabase.auth.getUser(token);

if (!user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}

// Get user credits
const { data: userCredits } = await supabase
  .from('user_credits')
  .select('balance')
  .eq('user_id', user.id)
  .single();

const cost = MODEL_COSTS[model]; // 1.00, 1.50, or 0.50

if (userCredits.balance < cost) {
  return new Response(JSON.stringify({ 
    error: 'Insufficient credits',
    required: cost,
    balance: userCredits.balance
  }), { status: 402 });
}

// Generate website...

// On success, deduct credits
await supabase
  .from('user_credits')
  .update({ 
    balance: userCredits.balance - cost,
    total_spent: userCredits.total_spent + cost,
    total_generations: userCredits.total_generations + 1,
    updated_at: new Date().toISOString()
  })
  .eq('user_id', user.id);

// Log to history
await supabase
  .from('webgen_history')
  .insert({
    user_id: user.id,
    model: model,
    cost: cost,
    prompt: prompt.substring(0, 500),
    success: true
  });
```

---

## UI Components

### Login Gate Design

```text
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    ✨ AI Website Generator                     │
│                                                                │
│      Create stunning websites with AI in seconds               │
│                                                                │
│   ┌──────────────────────────────────────────────────────┐    │
│   │                                                      │    │
│   │            🎉 Get $5.00 FREE Credits                 │    │
│   │                                                      │    │
│   │  ┌──────────────────────────────────────────────┐   │    │
│   │  │         Sign in with GitHub                  │   │    │
│   │  │              🐙                              │   │    │
│   │  └──────────────────────────────────────────────┘   │    │
│   │                                                      │    │
│   │   Pricing per Generation:                            │    │
│   │   • Claude (Best) .......... $1.00                  │    │
│   │   • GPT 5.2 ................ $1.50                  │    │
│   │   • Qwen Coder ............. $0.50                  │    │
│   │                                                      │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Credits Display (in header)

```text
┌─────────────────────────────────────────────────────────────┐
│  FARABI.me    [Video BETA]   💰 $4.50  [👤 Avatar ▼]       │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/AuthContext.tsx` | Create | Auth provider with GitHub OAuth |
| `src/hooks/useWebGenAuth.ts` | Create | WebGen-specific auth hook |
| `src/components/webgen/LoginGate.tsx` | Create | Full-page login component |
| `src/components/webgen/CreditsDisplay.tsx` | Create | Balance display component |
| `src/pages/WebGen.tsx` | Modify | Integrate auth flow |
| `supabase/functions/web-gen/index.ts` | Modify | Add auth & credit deduction |
| Database | Migrate | Create user_credits and webgen_history tables |

---

## Security Considerations

1. **Server-side credit deduction**: Credits are only deducted in the edge function after successful generation, not on the client
2. **JWT verification**: All edge function calls verify the user's JWT token
3. **RLS policies**: Users can only read their own data
4. **Race condition prevention**: Use atomic updates for credit deduction
5. **No client-side balance manipulation**: Balance is always fetched fresh from the database

---

## Multi-Model Mode Pricing

For multi-model mode (all 3 models in parallel):
- Total cost: $1.00 + $1.50 + $0.50 = **$3.00**
- User must have at least $3.00 in credits
- All 3 generations are charged upfront

---

## Summary

This implementation provides:
- GitHub-only authentication for /web page
- $5.00 free credits for new users
- Per-model pricing (Claude $1.00, GPT $1.50, Qwen $0.50)
- Server-side credit validation and deduction
- Beautiful login gate matching WebGen aesthetic
- Credits display in header
- Full generation history tracking
