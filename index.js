const AutomationAgent = require('./src/agent');

async function main() {
  console.log("==========================================");
  console.log("   Website Automation Agent Initialized   ");
  console.log("==========================================\\n");

  const agent = new AutomationAgent();
  
  // The target task from the assignment
  const targetTask = "Navigate to https://ui.shadcn.com/docs/forms/react-hook-form. Identify the form elements on the page (specifically the 'Username' or 'Name' field, and the 'Description' or 'Bio' field). Automatically fill in the Name field with 'John Doe' and the Description field with 'This is an automated test description.'. Submit the form if there is a submit button.";

  await agent.run(targetTask, 20);
}

main().catch(console.error);
