## Installing npm packages - very important!

This project might be run in a Docker sandbox VM, or on the Mac host. The VM is broken in ways that cause `npm install` to fail.

**How to detect you're in the Docker sandbox VM:** You're on Linux (`uname -s` = `Linux`) but the workspace path starts with `/Users/` (macOS-style path).

**On the host (macOS):** `npm install` works normally.

**In the VM:** The sandbox proxy and bidirectional file sync both corrupt node_modules. The proxy garbles downloads under concurrent load, and the sync daemon corrupts platform-specific native binaries when resolving conflicts between host and VM versions. To avoid both issues, install outside the synced workspace then copy in:

```bash
rm -rf /tmp/fresh-install && mkdir /tmp/fresh-install
cp package.json package-lock.json /tmp/fresh-install/
npm install --maxsockets=1 --prefix /tmp/fresh-install
rm -rf node_modules
cp -a /tmp/fresh-install/node_modules ./node_modules
```

## Signs of corruption

Dev server crashes with segfault (exit 139), SIGILL (exit 132), or esbuild reports `Unexpected "\x00"`. If this happens, re-run the install steps above. If a single package is corrupted, you can fix just that one via curl (which bypasses the proxy):

```bash
PKG="@tailwindcss/oxide-linux-arm64-gnu"  # the corrupted package
VER=$(node -e "console.log(require('./node_modules/$PKG/package.json').version)")
TARBALL=$(echo "$PKG" | sed 's|@.*\/||')
curl -sL "https://registry.npmjs.org/${PKG}/-/${TARBALL}-${VER}.tgz" | tar xzf - -C /tmp/fix-pkg
cp -f /tmp/fix-pkg/package/* ./node_modules/${PKG}/
rm -rf /tmp/fix-pkg
```
