#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import vibeMetadata from "@vibe/core/meta" with { type: "json" };
import { llmContextFileMapping } from "./context/index.js";
import * as fs from "fs/promises";
const server = new McpServer({
    name: "Vibe",
    version: "0.1.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
server.tool("getComponentName", "Prints the name of a Vibe component", { component: z.string() }, async ({ component }) => {
    return {
        content: [
            {
                type: "text",
                text: component,
            },
        ],
    };
});
server.tool("getVibeComponentMetadata", "Gets the props and types of a Vibe component", { componentName: z.string().optional().describe('Optional. The name of the component to get metadata for (e.g., Button, TextField). If omitted, returns metadata for all components.') }, async ({ componentName }) => {
    try {
        if (componentName) {
            const componentMeta = vibeMetadata.filter(component => component.displayName === componentName);
            if (componentMeta.length === 0) {
                return {
                    content: [{ type: "text", text: `Error in getVibeComponentMetadata: Component '${componentName}' not found.` }],
                    isError: true,
                };
            }
            // Prefer the 'next' version if exists
            const nextComponent = componentMeta.find(component => component.aggregator === 'next');
            const result = nextComponent || componentMeta[0];
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        // Return all metadata for all components if componentName is not provided
        return {
            content: [{ type: "text", text: JSON.stringify(vibeMetadata, null, 2) }],
        };
    }
    catch (e) {
        const message = (e instanceof Error ? e.message : e) || `Failed to get metadata${componentName ? ` for ${componentName}` : ''}`;
        return {
            content: [{ type: "text", text: `Error in getVibeComponentMetadata: ${message}` }],
            isError: true,
        };
    }
});
server.tool("listPublicComponents", "Returns a list of available Vibe components", {}, async ({}) => {
    try {
        const components = vibeMetadata.map((component) => component.displayName);
        // Remove duplicates if a component has a next version
        const uniqueComponents = [...new Set(components)];
        return {
            content: [
                { type: "text", text: JSON.stringify(uniqueComponents, null, 2) },
            ],
        };
    }
    catch (e) {
        const message = (e instanceof Error ? e.message : e) ||
            "Failed to get published components";
        return {
            content: [
                {
                    type: "text",
                    text: `Error in listPublicComponents: ${message}`,
                },
            ],
            isError: true,
        };
    }
});
// TODO: write the get component boilerplate resource/tool
server.tool("getComponentContext", "Return context for a given component for the LLM to use to write code", { componentName: z.string().describe('The name of the component to get code samples for') }, async ({ componentName }) => {
    try {
        const contextFilePath = llmContextFileMapping[componentName];
        const contextFileContents = await fs.readFile(contextFilePath, 'utf-8');
        return { content: [{ type: "text", text: componentName }, { type: "text", text: contextFileContents }] };
    }
    catch (e) {
        const message = (e instanceof Error ? e.message : e) ||
            "Failed to get code samples";
        return {
            content: [
                {
                    type: "text",
                    text: `Error in getComponentExampleCode: ${message}`,
                },
            ],
            isError: true,
        };
    }
});
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Vibe MCP Server running on stdio");
}
runServer().catch((err) => {
    console.error(err);
});
