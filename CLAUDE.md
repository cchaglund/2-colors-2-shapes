# Description of project

2 Colors 2 Shapes is a daily creative challenge web app where users create constrained artwork using 2 randomly-assigned colors and 2 geometric shapes on a Figma-style canvas editor, with community voting and ELO-based rankings.

# Best Practices
Ask yourself "what's the best way to do this?", NOT "what's the easiest/quickest way to do this?".

Turn off the lights when you leave:
- if you've started a dev server, stop it before you consider yourself finished.
- If you've started an MCP server, stop it before you go (e.g. Chrome dev tools or playwright), killing it if necessary.

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Agent Browser/Visual Testing

The agent can log in, allowing them to see and test many of the features (which are hidden behind a login). The account has admin privileges (`is_admin: true`), letting them also e.g. view the admin dashboard.

**Credentials:** 
See `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `.env.local`

**Login from browser:**
- Browser console: `import('./lib/supabase').then(m => m.testLogin(email, password))`

**Login from Node.js script:**
```js
const { testLogin } = await import('./src/lib/supabase.ts');
await testLogin('agent@test.local', 'vbe2HJG7tfu*qvq0jrt');
```

**Login from React component:**
```js
const { signInWithEmail } = useAuth();
await signInWithEmail('agent@test.local', 'vbe2HJG7tfu*qvq0jrt');
```

## Visual Demo Pages (`src/test/`)

⚠️ **These are NOT automated tests.** They are visual demo pages (like Storybook) for manually viewing component states with mock data.

- `?test=voting` - Voting components demo
- `?test=social` - Social features demo (Wall, Follows, Friends)

**Prefer testing real components** by logging in with the test account above and interacting with the actual app. The demo pages use mock data and some have standalone reimplementations that may not reflect actual component behavior.
