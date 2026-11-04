/**
 * What one draw is allowed to reveal, in one place.
 *
 * The organizer dashboard, the CSV export and the delivery buttons all read
 * this policy instead of each poking at the flags themselves — so blind mode
 * cannot "leak" through a page that forgot to check.
 */

export type DeliveryMode = "email" | "link";

export interface ExchangeFlags {
  delivery_mode?: string | null;
  blind_mode?: boolean | null;
}

export interface ExchangePolicy {
  deliveryMode: DeliveryMode;
  blind: boolean;
  /** Never true in blind mode — the pairings must not even be queried. */
  showPairings: boolean;
  /** CSV export is a full pairing list, so blind mode disables it. */
  canExportPairs: boolean;
  /** Email delivery only: link-mode draws have no email to resend or track. */
  sendsEmail: boolean;
  canResendEmail: boolean;
  /** Link-mode draws hand every assignment link to the organizer instead. */
  showsPrivateLinks: boolean;
}

export function exchangePolicy(exchange: ExchangeFlags | null | undefined): ExchangePolicy {
  const blind = Boolean(exchange?.blind_mode);
  const deliveryMode: DeliveryMode =
    exchange?.delivery_mode === "link" ? "link" : "email";
  const sendsEmail = deliveryMode === "email";

  return {
    deliveryMode,
    blind,
    showPairings: !blind,
    canExportPairs: !blind,
    sendsEmail,
    canResendEmail: sendsEmail,
    showsPrivateLinks: deliveryMode === "link",
  };
}

/**
 * Blind mode cannot be combined with private links: the organizer physically
 * holds every link, so claiming the dashboard is blind would be theatre.
 */
export function isValidModeCombination(mode: DeliveryMode, blind: boolean): boolean {
  return !blind || mode === "email";
}
