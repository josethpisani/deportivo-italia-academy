export const identityDocumentTypes = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};
const maxBytes = 2_000_000;

export function unpackRegistrationUpload(body) {
  if (!Buffer.isBuffer(body) || body.length < 4) return null;
  const headerSize = body.readUInt32BE(0);
  if (!headerSize || headerSize > 32_768 || headerSize + 4 > body.length) return null;
  let header;
  try {
    header = JSON.parse(body.toString("utf8", 4, headerSize + 4));
  } catch {
    return null;
  }
  if (!header?.value || typeof header.value !== "object" || Array.isArray(header.value)) return null;
  const { athleteSize, representativeSize, athleteType, representativeType, value } = header;
  const sizes = [athleteSize, representativeSize];
  const types = [athleteType, representativeType];
  const fileStart = headerSize + 4;
  if (!sizes.every(size => Number.isInteger(size) && size > 0 && size <= maxBytes) ||
      !types.every(type => Object.hasOwn(identityDocumentTypes, type)) ||
      fileStart + athleteSize + representativeSize !== body.length) return null;
  const secondFileStart = fileStart + athleteSize;
  return {
    key: "registration_requests",
    sede_id: value.sede_id,
    value: {
      ...value,
      athlete_document: `data:${athleteType};base64,${body.subarray(fileStart, secondFileStart).toString("base64")}`,
      representative_document: `data:${representativeType};base64,${body.subarray(secondFileStart).toString("base64")}`,
    },
  };
}

export function parseIdentityDocument(value) {
  if (typeof value !== "string" || value.length > maxBytes * 4 / 3 + 64) return null;
  const match = /^data:(application\/pdf|image\/(?:jpeg|png));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return null;
  const [, mime, data] = match;
  const content = Buffer.from(data, "base64");
  if (content.length > maxBytes || content.toString("base64") !== data) return null;
  const signatures = {
    "application/pdf": Buffer.from("%PDF-"),
    "image/jpeg": Buffer.from([0xff, 0xd8, 0xff]),
    "image/png": Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  };
  const signature = signatures[mime];
  return content.length > signature.length && content.subarray(0, signature.length).equals(signature)
    ? { mime, data }
    : null;
}
