# mcp-server-cappt: A MCP server for Cappt

<div align="center">
  <img alt="Cappt" height="128" width="128" src="https://raw.githubusercontent.com/cappt-team/mcp-server-nodejs/main/assets/logo.png"/>
</div>

## Overview

A Model Context Protocol server for generating outline and presentation with cappt.cc.

### Tools

1. `generate_presentation`

- Generate a presentation from outline (generated by `generate_outline`)
- Input:
  - `outline` (string): a standard outline
  - `include_gallery` (bool): whether to include gallery in result
  - `include_preview` (bool): whether to include preview in result
- Returns:
  - `record_id`: the record ID of the generated presentation
  - `status`: the status of the generation process'
  - `total_page`: the total number of slides in the presentation
  - `editor_url`: the URL to edit the presentation
  - `title`: the title of the presentation
  - `thumbanil`: the thumbnail of the presentation
  - `gallery`： the gallery of the presentation
  - `preview`: the preview of the presentation

### Prompts

1. `geenrate_outline`

- Generate a standard outline
- Input:
  - `input` (string): user input, eg, title, article, etc.
- Returns: A standard outline

## Installation

```
cd path/to/repo
npm install
npm run build
```

## Configuration

### Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sentry": {
      "command": "node",
      "args": [
        "path/to/repo/dist/index.js"
      ],
      "env": {
        "CAPPT_TOKEN": "YOUR_CAPPT_TOKEN"
      }
    }
  }
}
```

## Debugging

You can use the MCP inspector to debug the server. Please make sure you have installed this package with `uv`, then run:

```
npx @modelcontextprotocol/inspector node dist/index.ts
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
