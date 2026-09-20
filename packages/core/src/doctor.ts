import { probeHost, type HostProbe } from "../../../adapters/host/probe.ts";

export type DoctorReport = HostProbe & {
  schemaVersion: 1;
  paidCalls: 0;
};

type DoctorInput = {
  env?: Record<string, string | undefined>;
  platform?: string;
  arch?: string;
};

export async function runDoctor(input: DoctorInput = {}): Promise<DoctorReport> {
  const probe = probeHost({
    env: input.env ?? process.env,
    platform: input.platform ?? process.platform,
    arch: input.arch ?? process.arch
  });

  return {
    schemaVersion: 1,
    ...probe,
    paidCalls: 0
  };
}
