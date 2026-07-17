import { workStatusService } from "@src/common/services/work-status-service";
import { ContentScript } from "../content-script";

type SubscriptionData = {
  workId: string;
  status: boolean; // True for subscribed, false for unsubscribed
};

export default class SubscriptionObserver extends ContentScript {
  private subscribeButtonClickHandler?: (event: Event) => void;

  getEnabled(): boolean {
    this.logger.log("Checking if subscription observer is enabled");

    // Match individual work pages like /works/12345 or /works/12345/chapters/67890
    const urlPatterns = [
      /\/works\/\d+$/,
      /\/works\/\d+\/chapters\/\d+$/,
      /\/works\/\d+\?.*$/,
    ];

    const isEnabledByPathname = urlPatterns.some((pattern) =>
      pattern.test(window.location.pathname + window.location.search),
    );

    this.logger.log(
      "Subscription observer is enabled",
      isEnabledByPathname,
      window.location.pathname,
      window.location.search,
    );

    return isEnabledByPathname;
  }

  async onProcess(): Promise<void> {
    try {
      this.setupSubscriptionListener();
    } catch (error) {
      this.logger.error("Failed to setup subscription observer", error);
    }
  }

  onDestroy(): void {
    this.removeSubscriptionListener();
  }

  private setupSubscriptionListener(): void {
    // Remove any existing listener first
    this.removeSubscriptionListener();

    // Find the subscribe form
    const subscribeForm = document.querySelector("li.subscribe form");

    if (!subscribeForm) {
      this.logger.log("No subscribe form found on page");

      return;
    }

    const submitButton: HTMLInputElement | null = subscribeForm.querySelector(
      'input[type="submit"]',
    );

    if (!submitButton) {
      this.logger.log("No submit button found in subscribe form");

      return;
    }

    // Create the click handler
    this.subscribeButtonClickHandler = () => {
      // Handle the async operation without making the handler async
      this.handleSubscriptionClick(subscribeForm, submitButton).catch(
        (error: unknown) => {
          this.logger.error("Error handling subscription click", error);
        },
      );
    };

    // Add the event listener
    submitButton.addEventListener("click", this.subscribeButtonClickHandler);

    this.logger.log("Subscription listener setup complete");
  }

  private removeSubscriptionListener(): void {
    if (this.subscribeButtonClickHandler) {
      const subscribeForm = document.querySelector("li.subscribe form");
      const submitButton = subscribeForm?.querySelector(
        'input[type="submit"]',
      ) as HTMLInputElement | null;

      if (submitButton) {
        submitButton.removeEventListener(
          "click",
          this.subscribeButtonClickHandler,
        );
      }

      this.subscribeButtonClickHandler = undefined;
    }
  }

  private async handleSubscriptionClick(
    form: Element,
    submitButton: HTMLInputElement,
  ): Promise<void> {
    const workId = this.extractWorkId();

    if (!workId) {
      this.logger.error("Could not extract work ID from URL");

      return;
    }

    // Determine the current status and what the new status will be
    const currentStatus = this.getCurrentSubscriptionStatus(submitButton);
    const newStatus = !currentStatus; // Toggle the status

    this.logger.log(
      `Subscription status changing from ${String(currentStatus)} to ${String(newStatus)} for work ${workId}`,
    );

    // Send the subscription update to the server
    // Don't await this to avoid blocking AO3's AJAX
    await this.sendSubscriptionToServer({
      workId,
      status: newStatus,
    }).catch((error: unknown) => {
      this.logger.error("Failed to send subscription update to server", error);
    });

    // Let AO3's existing AJAX handle the form submission
    // We don't interfere with the default click behavior
  }

  private extractWorkId(): string | null {
    const workIdMatch = /\/works\/(\d+)/.exec(window.location.pathname);

    return workIdMatch ? workIdMatch[1] : null;
  }

  private getCurrentSubscriptionStatus(
    submitButton: HTMLInputElement,
  ): boolean {
    const buttonValue = submitButton.value.trim();

    if (buttonValue === "Unsubscribe") {
      return true; // Currently subscribed
    }

    if (buttonValue === "Subscribe") {
      return false; // Currently not subscribed
    }

    // Fallback: check for delete method input which indicates unsubscribe form
    const form = submitButton.closest("form");
    const deleteMethodInput = form?.querySelector(
      'input[name="_method"][value="delete"]',
    );

    if (deleteMethodInput) {
      return true; // Currently subscribed (unsubscribe form)
    }

    // Default to not subscribed if we can't determine
    this.logger.warn(
      "Could not determine subscription status, defaulting to false",
    );

    return false;
  }

  private async sendSubscriptionToServer(
    subscriptionData: SubscriptionData,
  ): Promise<void> {
    // Errors are swallowed inside the service so we never interfere with
    // AO3's own subscribe AJAX
    const recorded = await workStatusService.setSubscribed(
      this.settings,
      subscriptionData.workId,
      subscriptionData.status,
    );

    if (recorded) {
      this.logger.log(
        `Successfully updated subscription status for work ${subscriptionData.workId} to ${String(subscriptionData.status)}`,
      );
    }
  }
}
