# SMP Auth Site

This site now includes a minimal file-backed account database using `accounts.json`.

## Files
- `server.js` — local web server and API for signup/login
- `accounts.json` — stored account list
- `home.html` — protected site page
- `LOGEN .HTML` — login / signup page
- `package.json` — start script

## How to run
1. Install Node.js from https://nodejs.org
2. Open a terminal in `c:\Users\Administrator\Desktop\smp`
3. Run:
   ```powershell
   node server.js
   ```
4. Open `http://localhost:3000/`

## Behavior
- `Create Account` stores username/password in `accounts.json`
- `Login` verifies the same credentials against that file
- Successful login redirects to `home.html`
- `home.html` checks login status before showing content
