# Architecture Document

## Overview
This project implements an AI-driven browser automation agent. It acts as a bridge between an LLM (OpenAI) and a browser automation framework (Playwright). The system operates on a state-action loop where the LLM is fed the current visual/structural state of the page and returns a specific tool invocation (e.g., clicking specific coordinates).

## Core Modules

### 1. Browser Manager (\`src/browser.js\`)
A wrapper class over Playwright. It abstracts away complex Playwright logic and exposes simple, atomic functions that exactly match the required assignment tools (\`navigate_to_url\`, \`click_on_screen\`, \`send_keys\`, etc.). This ensures modularity and safety.

### 2. DOM Extractor (\`src/dom_extractor.js\`)
A JavaScript script injected into the page's execution context. Its purpose is "intelligent element identification". Instead of passing the entire raw HTML to the LLM (which is token-heavy and confusing), it:
- Identifies all interactable elements (links, buttons, inputs, textareas).
- Checks their visibility (width/height > 0 and within viewport).
- Computes their absolute \`x\` and \`y\` center coordinates.
- Extracts meaningful labels (placeholder, innerText, aria-label, or associated \`<label>\` tags).

### 3. Agent Loop (\`src/agent.js\`)
The core orchestrator. It runs a `while` loop (up to a maximum step limit):
1. **Perceive**: Injects the DOM extractor and gets a string representation of the interactive elements on the screen.
2. **Think**: Sends the objective, the current state, and the available tools to the OpenAI API.
3. **Act**: Parses the LLM's chosen function call, invokes the corresponding method in the \`BrowserManager\`, and logs the result back into the message history for the next iteration.

## Design Decisions
- **Coordinates over Selectors**: The LLM is instructed to use \`click_on_screen(x, y)\` instead of CSS selectors. This mimics human interaction and aligns with "Browser Use" paradigms, making it less brittle to class name changes.
- **State Truncation**: Only visible elements within the viewport are sent to the LLM to save context window and avoid hallucinated clicks on off-screen elements. If the target isn't visible, the LLM is instructed to use the \`scroll\` tool.
- **Separation of Concerns**: Tools definition, LLM interaction, and Browser control are strictly separated. This allows swapping Playwright for Puppeteer, or OpenAI for another provider, with minimal changes.
