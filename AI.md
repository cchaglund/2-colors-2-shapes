To agents - this is not for you, stop reading here.

https://docs.docker.com/ai/sandboxes/ 

To init, run this in your project:
`docker sandbox run claude`

It will create a linux VM with claude installed. All files in the current directory will be available inside the VM.
You will need to authenticate with claude once (make sure you copy the URL properly, it's a bit finicky).

To add an MCP tool, you'll have to ask claude to install it for you, e.g.: 
```❯ can you add the playwright mcp? i know it'll only become available in the next session. this is the command: `claude mcp add playwright npx @playwright/mcp@latest````

Then you'll have to stop (regular ctrl-c) and restart the sandbox for it to take effect. You can check by simply asking claude: `❯ can you list the installed mcp tools?`

Chrome, and therefore regular playwright, isn't supported on ARM64 linux. You can ask it to use firefox instead:
```❯ can you configure the playwright mcp to use firefox instead of chrome? This should be done in "~/.claude.json" and when you're done the config should look a little like this:
`"args": [
     "@playwright/mcp@latest",
     "--browser",
     "firefox"
],`
```

Ask the agent to install any packages you need using apt, yum, etc.

"When an agent runs docker build or docker compose up, those commands execute inside the sandbox using the private daemon. The agent sees only containers it creates. It cannot access your host containers, images, or volumes."

Important! These persist until you remove the VM:
- Docker images and containers - Built or pulled by the agent
- Installed packages - System packages added with apt, yum, etc.
- Agent state - Credentials, configuration, history
- Workspace changes - Files created or modified sync back to host

Each sandbox has its own:
- Docker daemon state
- Image cache
- Package installations

When you remove a sandbox with docker sandbox rm, the entire VM and its contents are deleted. Images built inside the sandbox, packages installed, and any state not synced to your workspace are gone.

Access the sandbox directly with an interactive shell:
`docker sandbox exec -it <sandbox-name> bash`

Inside the shell, you can inspect the environment, manually install packages, or check Docker containers:
```bash
    agent@sandbox:~$ docker ps
    agent@sandbox:~$ docker images
```

# PROBLEMS WITH THE SANDBOX

The sandbox VM runs ARM64 Linux. When the agent installs npm packages, they're Linux ARM64 binaries. Your Mac also runs ARM64 but with Darwin (macOS), so the native binaries are incompatible.

Old workaround (annoying): `rm -rf node_modules && npm install` every time you switch between running locally and in the sandbox.

(Can the agent inside the VM run "make dev" for projects that use kubernetes?)

# Container solution!

Run the dev server in a Docker container with the same architecture as the sandbox (Linux ARM64). The entire repo is mounted, so it uses the same node_modules the agent installed.

**To start:**
```
npm run dev:docker
```

**What it does:**
- Builds a lightweight container from `Dockerfile.dev`
- Mounts the repo into the container
- Starts Vite on port 5173
- Logs stream to your terminal
- Ctrl+C to stop (ignore the npm SIGINT messages, they're normal)

**View the app:** http://localhost:5173

Hot reload works - edit files locally and changes appear in the browser.
