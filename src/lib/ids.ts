import { randomBytes } from "crypto";

export function newJrId(): string {
  return `jr_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

export function newObId(): string {
  return `ob_${Date.now()}_${randomBytes(4).toString("hex")}`;
}
