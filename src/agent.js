require('dotenv').config();
const OpenAI = require('openai');
const BrowserManager = require('./browser');
const { getInteractiveElements, formatElementsForPrompt } = require('./dom_extractor');

class AutomationAgent {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
    this.browserManager = new BrowserManager();
    this.messages = [];
  }

  getTools() {
    return [
      {
        type: "function",
        function: {
          name: "open_browser",
          description: "Initialize and launch a browser instance.",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "navigate_to_url",
          description: "Direct the browser to a specific URL.",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "The complete URL to navigate to." }
            },
            required: ["url"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "take_screenshot",
          description: "Capture the current state of the browser window.",
          parameters: {
            type: "object",
            properties: {
              filepath: { type: "string", description: "Optional path to save screenshot." }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "click_on_screen",
          description: "Perform mouse clicks at specified coordinates.",
          parameters: {
            type: "object",
            properties: {
              x: { type: "number", description: "The x coordinate to click." },
              y: { type: "number", description: "The y coordinate to click." }
            },
            required: ["x", "y"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "send_keys",
          description: "Input text into form fields or text areas. You must have focused/clicked on the field first.",
          parameters: {
            type: "object",
            properties: {
              text: { type: "string", description: "The text to type." }
            },
            required: ["text"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "scroll",
          description: "Scroll the page to reveal hidden elements.",
          parameters: {
            type: "object",
            properties: {
              deltaY: { type: "number", description: "Amount to scroll vertically. Positive is down." }
            },
            required: ["deltaY"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "double_click",
          description: "Perform double-click actions when necessary.",
          parameters: {
            type: "object",
            properties: {
              x: { type: "number", description: "The x coordinate to double click." },
              y: { type: "number", description: "The y coordinate to double click." }
            },
            required: ["x", "y"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "task_complete",
          description: "Call this when the primary objective has been achieved.",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Summary of what was accomplished." }
            },
            required: ["summary"]
          }
        }
      }
    ];
  }

  async executeTool(name, args) {
    console.log(`[Agent] Executing tool: ${name}(${JSON.stringify(args)})`);
    try {
      switch (name) {
        case 'open_browser':
          const isHeadless = process.env.HEADLESS === 'true';
          await this.browserManager.open_browser(isHeadless);
          return "Browser opened successfully.";
        case 'navigate_to_url':
          await this.browserManager.navigate_to_url(args.url);
          return `Navigated to ${args.url}`;
        case 'take_screenshot':
          const path = await this.browserManager.take_screenshot(args.filepath || 'screenshot.png');
          return `Screenshot taken and saved to ${path}`;
        case 'click_on_screen':
          await this.browserManager.click_on_screen(args.x, args.y);
          return `Clicked at (${args.x}, ${args.y})`;
        case 'send_keys':
          await this.browserManager.send_keys(args.text);
          return `Typed: ${args.text}`;
        case 'scroll':
          await this.browserManager.scroll(args.deltaY);
          return `Scrolled by ${args.deltaY}`;
        case 'double_click':
          await this.browserManager.double_click(args.x, args.y);
          return `Double clicked at (${args.x}, ${args.y})`;
        case 'task_complete':
          return `Task complete: ${args.summary}`;
        default:
          return `Unknown tool: ${name}`;
      }
    } catch (error) {
      console.error(`[Agent] Tool error (${name}):`, error.message);
      return `Error executing ${name}: ${error.message}`;
    }
  }

  async run(objective, maxSteps = 15) {
    console.log(`[Agent] Starting task: "${objective}"`);
    
    this.messages.push({
      role: "system",
      content: `You are an intelligent website automation agent. Your objective is: "${objective}".
You have access to tools to control a browser. 
To achieve your goal, you MUST follow these steps:
1. Open the browser.
2. Navigate to the required URL.
3. Observe the current state of the page (provided by the system as a list of interactive elements with their x/y coordinates).
4. Decide the next action based on the state. For example, to type in an input, you must first click_on_screen at its x, y coordinates, then use send_keys.
5. If the element you need is not visible, use the scroll tool.
6. When the task is complete, call task_complete.
You should execute one tool at a time, check the result, and decide the next step.`
    });

    for (let step = 1; step <= maxSteps; step++) {
      console.log(`\n--- Step ${step} ---`);
      
      // Get current page state if browser is open
      let stateDesc = "Browser is not currently open.";
      if (this.browserManager.page) {
        const elements = await getInteractiveElements(this.browserManager);
        stateDesc = formatElementsForPrompt(elements);
      }

      this.messages.push({
        role: "user",
        content: `Current State:\n${stateDesc}\n\nWhat is your next action?`
      });

      let response;
      try {
        response = await this.openai.chat.completions.create({
          model: "llama-3.3-70b-versatile", 
          messages: this.messages,
          tools: this.getTools(),
          tool_choice: "auto",
          parallel_tool_calls: false,
        });
      } catch (error) {
        if (error.error && error.error.failed_generation) {
          console.warn("[Agent] Model formatting error detected. Recovering...");
          if (error.error.failed_generation.includes('task_complete')) {
            console.log(`\n[Agent] Task finished successfully! Summary: ${error.error.failed_generation}`);
            break;
          }
          this.messages.push({
            role: "user",
            content: `System Error: You failed to call the function properly. Please use the standard JSON tool calling format.`
          });
          continue;
        }
        throw error;
      }

      const responseMessage = response.choices[0].message;
      this.messages.push(responseMessage);

      if (responseMessage.tool_calls) {
        let isComplete = false;
        
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          if (functionName === 'task_complete') {
            console.log(`\n[Agent] Task finished successfully! Summary: ${functionArgs.summary}`);
            isComplete = true;
            break;
          }

          const functionResult = await this.executeTool(functionName, functionArgs);
          
          this.messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: functionResult,
          });
        }

        if (isComplete) break;
      } else {
        console.log(`[Agent] Thought: ${responseMessage.content}`);
      }
      
      // Small pause between steps
      await new Promise(r => setTimeout(r, 1000));
    }

    await this.browserManager.close_browser();
    console.log('[Agent] Run loop ended.');
  }
}

module.exports = AutomationAgent;
