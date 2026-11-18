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
  const { athleteSize, representativeSize, value } = header;
  const sizes = [athleteSize, representativeSize];
  const fileStart = headerSize + 4;
  if (!sizes.every(size => Number.isInteger(size) && size > 0 && size <= maxBytes) ||
      fileStart + athleteSize + representativeSize !== body.length) return null;
  const secondFileStart = fileStart + athleteSize;
  return {
    key: "registration_requests",
    sede_id: value.sede_id,
    value: {
      ...value,
      athlete_document_file: parseIdentityDocument(body.subarray(fileStart, secondFileStart)),
      representative_document_file: parseIdentityDocument(body.subarray(secondFileStart)),
    },
  };
}

function parseIdentityDocument(content) {
  const signatures = {
    "application/pdf": Buffer.from("%PDF-"),
    "image/jpeg": Buffer.from([0xff, 0xd8, 0xff]),
    "image/png": Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  };
  const mime = Object.keys(signatures).find(type => {
    const signature = signatures[type];
    return content.length > signature.length && content.subarray(0, signature.length).equals(signature);
  });
  return mime ? { mime, data: content.toString("base64") } : null;
}
