export interface MacDistributionConfig {
  signingIdentity: string;
  notaryProfile: string;
  notaryKeychain?: string;
}

type Environment = Record<string, string | undefined>;

function required(environment: Environment, name: string): string {
  const value = environment[name]?.trim();
  if (value) return value;
  throw new Error(
    `macOS releases require ${name}. PacePaper will not create another unnotarized Mac download.`,
  );
}

export function macDistributionConfig(environment: Environment = process.env): MacDistributionConfig {
  const signingIdentity = required(environment, "DIGITALDP_MAC_SIGN_IDENTITY");
  if (signingIdentity === "-") {
    throw new Error("DIGITALDP_MAC_SIGN_IDENTITY must be a Developer ID Application identity, not an ad-hoc identity");
  }

  return {
    signingIdentity,
    notaryProfile: required(environment, "DIGITALDP_MAC_NOTARY_PROFILE"),
    notaryKeychain: environment.DIGITALDP_MAC_NOTARY_KEYCHAIN?.trim() || undefined,
  };
}

export function notaryAuthenticationArguments(config: MacDistributionConfig): string[] {
  const arguments_ = ["--keychain-profile", config.notaryProfile];
  if (config.notaryKeychain) arguments_.push("--keychain", config.notaryKeychain);
  return arguments_;
}
