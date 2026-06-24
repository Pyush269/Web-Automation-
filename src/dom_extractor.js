/**
 * This script is executed within the browser page context to extract
 * interactive elements and their coordinates.
 */
const EXTRACT_SCRIPT = `
  (() => {
    const interactableSelectors = [
      'a[href]', 'button', 'input:not([type="hidden"])', 'textarea', 'select', '[tabindex]:not([tabindex="-1"])', '[role="button"]'
    ];
    
    const elements = Array.from(document.querySelectorAll(interactableSelectors.join(', ')));
    const visibleElements = [];

    elements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      
      // Check if element is visible
      if (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      ) {
        // Compute center point for clicking
        const centerX = Math.round(rect.left + rect.width / 2);
        const centerY = Math.round(rect.top + rect.height / 2);
        
        let label = el.innerText || el.value || el.placeholder || el.name || el.id || el.getAttribute('aria-label') || '';
        label = label.trim().substring(0, 50); // Truncate long labels
        
        // Context specific label fetching (e.g. for input fields check their associated labels)
        if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
            if (el.id) {
                const associatedLabel = document.querySelector(\`label[for="\${el.id}"]\`);
                if (associatedLabel) {
                    label = associatedLabel.innerText.trim();
                }
            }
            if(!label) {
                // look for previous sibling or parent text
                const parentText = el.parentElement.innerText.trim();
                if(parentText) {
                    label = parentText.split('\\n')[0];
                }
            }
        }

        visibleElements.push({
          id: index,
          tag: el.tagName.toLowerCase(),
          type: el.type || undefined,
          label: label,
          x: centerX,
          y: centerY
        });
      }
    });

    return visibleElements;
  })();
`;

async function getInteractiveElements(browserManager) {
  try {
    const elements = await browserManager.evaluate(EXTRACT_SCRIPT);
    return elements;
  } catch (error) {
    console.error('[DOM Extractor] Error extracting elements:', error);
    return [];
  }
}

function formatElementsForPrompt(elements) {
  if (!elements || elements.length === 0) return "No interactive elements visible.";
  
  let formatted = "Visible Interactive Elements:\n";
  elements.forEach(el => {
    formatted += `[${el.id}] <${el.tag}${el.type ? ` type="${el.type}"` : ''}> "${el.label}" - Center: (${el.x}, ${el.y})\n`;
  });
  return formatted;
}

module.exports = {
  getInteractiveElements,
  formatElementsForPrompt
};
