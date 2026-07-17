import TurndownService from "turndown";

class MarkdownService {
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService();
  }

  /**
   * Converts HTML content to markdown
   * @param htmlContent The HTML content to convert
   * @returns The markdown content, or null if conversion fails or content is empty
   */
  convertHtmlToMarkdown(htmlContent: string): string | null {
    if (!htmlContent.trim()) {
      return null;
    }

    try {
      const markdown = this.turndownService.turndown(htmlContent);

      return markdown.trim() || null;
    } catch (error) {
      console.error("Failed to convert HTML to markdown", error);

      return null;
    }
  }

  /**
   * Extracts summary from a DOM element and converts it to markdown
   * @param element The DOM element containing the summary
   * @param summarySelector The CSS selector for the summary element
   * @returns The markdown summary, or null if not found or empty
   */
  extractSummaryAsMarkdown(
    element: Element,
    summarySelector: string,
  ): string | null {
    const summaryElement = element.querySelector(summarySelector);

    if (!summaryElement) {
      return null;
    }

    // Get the HTML content
    const htmlContent = summaryElement.innerHTML.trim();

    if (!htmlContent) {
      return null;
    }

    const markdown = this.convertHtmlToMarkdown(htmlContent);

    // Fallback to text content if conversion fails
    if (!markdown) {
      return summaryElement.textContent.trim();
    }

    return markdown;
  }
}

// Export a singleton instance
export const markdownService = new MarkdownService();
