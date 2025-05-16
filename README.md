# MCP server for vibe component library

This MCP server exposes developer tools to use the Vibe component library more effectively. 

## Inspect the server locally

```
npm run inspect
```

## Adding the local dev server to Cursor

Copy the full path of `/dist/index.js` on your machine

Add the following config to the MCP config file (mcp.json): 
```json
{
  "mcpServers": {
    "monday-vibe-mcp": {
      "command": "node",
      "args": ["/Users/Spongebob/Documents/Development/vibe-mcp/dist/index.js"]
    }
  }
}
```