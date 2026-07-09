import { getRequest } from "./request";
import type { ObsidianResult } from "../shared/types";

export function fetchObsidianFile(filepath: string): Promise<ObsidianResult> {
  return getRequest(filepath, "text/markdown, text/plain;q=0.9, application/json;q=0.5, */*;q=0.1");
}
