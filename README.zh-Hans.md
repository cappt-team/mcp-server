# mcp-server-cappt: 咔片MCP服务器

<div align="center">
  <img alt="Cappt" height="128" width="128" src="./assets/logo.png"/>
</div>

## 概述

一个MCP（Model Context Protocol）服务器，用于生成咔片（cappt.cc）的提纲和演示文稿。

### 工具

1. `generate_presentation`

- 从提纲生成演示文稿（由 `generate_outline` 生成）
- 输入：
  - `outline`（字符串）：标准提纲
  - `include_gallery`（布尔值）：是否在结果中包含图库
- 返回：
  - `record_id`：生成的演示文稿的记录 ID
  - `status`：生成过程的状态
  - `total_page`：演示文稿的总页数
  - `editor_url`：编辑演示文稿的 URL
  - `title`：演示文稿的标题
  - `thumbnail`：演示文稿的缩略图
  - `gallery`：演示文稿的图库

### 提示词

1. `generate_outline`

- 生成标准提纲
- 输入：
  - `input`（字符串）：用户输入，例如标题、文章等
- 返回：标准提纲

## 安装

```
cd path/to/repo
npm install
npm run build
```

## 配置

### 与 Claude Desktop 一起使用

将以下内容添加到你的 `claude_desktop_config.json` 中：

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

## 调试

你可以使用 MCP 检查器来调试服务器。请确保你已使用 `uv` 安装此软件包，然后运行：

```
npx @modelcontextprotocol/inspector node dist/index.ts
```

## 许可证

此 MCP 服务器根据 MIT 许可证授权。这意味着你可以自由使用、修改和分发该软件，遵循 MIT 许可证的条款和条件。有关更多详细信息，请参阅项目存储库中的 LICENSE 文件。
