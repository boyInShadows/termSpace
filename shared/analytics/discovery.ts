export type DiscoveryEvent = "listing_click" | "install_command_copy";

export const DISCOVERY_EVENT = "termspace:discovery";

export function reportDiscovery(event: DiscoveryEvent) {
  window.dispatchEvent(new CustomEvent(DISCOVERY_EVENT, { detail: event }));
}
