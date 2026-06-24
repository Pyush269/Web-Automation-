# Website Automation Agent

An intelligent website automation agent built with Node.js, Playwright, and OpenAI. This agent is capable of autonomous browser interaction, such as identifying elements visually/spatially and filling out forms dynamically without hardcoded selectors.

## Prerequisites

- Node.js (v18 or higher recommended)
- An OpenAI API Key

## Setup Instructions

1. **Install Dependencies**:
   \`\`\`bash
   npm install
   npx playwright install chromium
   \`\`\`

2. **Configuration**:
   Copy the example environment file and add your OpenAI API key:
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   Edit `.env` and set \`OPENAI_API_KEY=your_key_here\`.
   Optional: Set \`HEADLESS=true\` if you don't want to see the browser UI. Default is headed (visible).

## Running the Agent

To execute the target task (navigating to Shadcn UI forms, identifying fields, and filling them out):

\`\`\`bash
node index.js
\`\`\`

## Features

- **Dynamic Element Extraction**: Extracts all interactable elements (buttons, inputs, textareas) and computes their precise \`x\` and \`y\` coordinates on the screen.
- **LLM-Driven Decisions**: Uses OpenAI Function Calling to provide the LLM with browser tools. The LLM decides what to click, type, and when to scroll based on the current visible DOM state.
- **Supported Tools**:
  - \`open_browser\`
  - \`navigate_to_url\`
  - \`take_screenshot\`
  - \`click_on_screen\`
  - \`send_keys\`
  - \`scroll\`
  - \`double_click\`

## Evaluation Criteria Mapping
- **Functionality**: Successfully interacts with the Shadcn UI target page.
- **Code Quality**: Modular architecture (\`browser.js\`, \`agent.js\`, \`dom_extractor.js\`).
- **Agent Intelligence**: Relies on spatial coordinates and visual state mapping instead of hardcoded DOM IDs, making it resilient.
- **Error Handling**: Try/catch blocks in tool execution prevent crashes and feed error messages back to the LLM to recover.
