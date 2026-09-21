import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { importDocxSource } from "../packages/core/src/content/import-docx.ts";
import { importPdfSource } from "../packages/core/src/content/import-pdf.ts";
import { openWorkspace } from "../packages/core/src/workspace/store.ts";

const DOCX = Buffer.from("UEsDBBQAAAAIABgWNV0XmADX6wAAALIBAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbH1QyU4DMQy98xWRr2gmAweEUKc9sByBQ/kAK/HMRM2mOC3t3+NpoQdUONpvs99itQ9e7aiwS7GHm7YDRdEk6+LYw8f6pbkHxRWjRZ8i9XAghtXyarE+ZGIl4sg9TLXmB63ZTBSQ25QpCjKkErDKWEad0WxwJH3bdXfapFgp1qbOHiBmTzTg1lf1vJf96ZJCnkE9nphzWA+Ys3cGq+B6F+2vmOY7ohXlkcOTy3wtBNCXI2bo74Qf4ZuUU5wl9Y6lvmIQmv5MxWqbzDaItP3f58KlaRicobN+dsslGWKW1oNvz0hAF88f6GPlyy9QSwMEFAAAAAgAGBY1XT+t/vqvAAAALAEAAAsAAABfcmVscy8ucmVsc43POw7CMAwA0J1TRN5pWgaEUEMXhNQVlQNEiZtWNB/F4dPbk4EBKgZG/57tunnaid0x0uidgKoogaFTXo/OCLh0p/UOGCXptJy8QwEzEjSHVX3GSaY8Q8MYiGXEkYAhpbDnnNSAVlLhA7pc6X20MuUwGh6kukqDfFOWWx4/DVigrNUCYqsrYN0c8B/c9/2o8OjVzaJLP3YsOrIso8Ek4OGj5vqdLjILPJ/Dv548vABQSwMEFAAAAAgAGBY1XRlDikbkAAAAXwEAABEAAAB3b3JkL2RvY3VtZW50LnhtbG1QO04DMRDtcwrLPfFCgdBq1ymQcoLkAI5tkpXWM5ZtstkaoVSUIMoIam6Q62Sl3ALbK5qE5s2bz3szmmq2My3ZaucbhJreTgtKNEhUDaxrulzMbx4o8UGAEi2CrmmvPZ3xSdWVCuWz0RBIdABfdjXdhGBLxrzcaCP8FK2G2HtCZ0SIqVuzDp2yDqX2Pi4wLbsrintmRAM0e65Q9ZlYHsElCHw47M9fnxVLPKHLaK/nfr6Hjz15RAjprLmQAV3/vy6s2iwapZJfWJ3e3k+vL8PheK3OFTmGsZa8Jonk6xP5ew3/BVBLAQIUAxQAAAAIABgWNV0XmADX6wAAALIBAAATAAAAAAAAAAAAAACAAQAAAABbQ29udGVudF9UeXBlc10ueG1sUEsBAhQDFAAAAAgAGBY1XT+t/vqvAAAALAEAAAsAAAAAAAAAAAAAAIABHAEAAF9yZWxzLy5yZWxzUEsBAhQDFAAAAAgAGBY1XRlDikbkAAAAXwEAABEAAAAAAAAAAAAAAIAB9AEAAHdvcmQvZG9jdW1lbnQueG1sUEsFBgAAAAADAAMAuQAAAAcDAAAAAA==", "base64");
const EXTERNAL_DOCX = Buffer.from("UEsDBBQAAAAIACUWNV2sbhJangAAANwAAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbF2PsQ7CMBBDf6XKitqrGBhQ24UdGPiBU3JtI5pLlBwF/p4EpA6Mlu1nubu9A6Xq5RZOvZpFwhEg6ZkcpsYH4uyMPjqULOMEAfUdJ4J92x5AexZiqaUw1NBdVorRGqquGOWMjnoFTx8NGK8fLiebTFPV6Vcry73CEBarUaxnWNn8bdZ+HK2mrV9oIXpNKVme3NJsjkPLu4KHoYPvqeEDUEsDBBQAAAAIACUWNV1hey9DiQAAAPIAAAALAAAAX3JlbHMvLnJlbHONzzsOAiEQBuCrEA6ws1pYGKCy2dZ4AQLDIy6PDBj19lJYrMbCcuaffH9GnHHVPZbcQqyNPdKam+Sh93oEaCZg0m0qFfNIXKGk+xjJQ9Xmqj3Cfp4PQFuDK7E12WIlp8XuOLs8K/5jF+eiwVMxt4S5/6j4uhiyJo9d8nshC/a9ngbLQQn4eFG9AFBLAwQUAAAACAAlFjVdsMQQ4XsAAACjAAAAEQAAAHdvcmQvZG9jdW1lbnQueG1sRc7BDsIgDAbgV1n2AHbx4IEgNx8EATcitKTUsL29MA9evqZ/07S6KU/ukwPKtOeEVbX7vIkUBVDdFrKtFyoB++xFnK30lldoxL4wuVBrxDUnuC7LDbKNOBvd1JP8MWoZ8EDMY5fAaNOUIr6nflTDiId8Wk5/q/B/y3wBUEsDBBQAAAAIACUWNV10dn5vmwAAAAcBAAAcAAAAd29yZC9fcmVscy9kb2N1bWVudC54bWwucmVsc43PTQrCMBAF4KuUHKBTXAhK25UuunAjXmBIp01o/piMUm9vQIQKLlw+HnyP117JodgYsrEpV6t3IXfKiKQjQNaGPOY6JgqlmSJ7lBJ5hoR6wZlg1zR74K2h+nZrVsPYKR7Gg6puz0T/2HGarKZT1HdPQX5MgCkSOxuWgiLPJG82F5ce1tW0ok+O4FNf4liWz6sQB3QK+ha+fvcvUEsBAhQDFAAAAAgAJRY1XaxuElqeAAAA3AAAABMAAAAAAAAAAAAAAIABAAAAAFtDb250ZW50X1R5cGVzXS54bWxQSwECFAMUAAAACAAlFjVdYXsvQ4kAAADyAAAACwAAAAAAAAAAAAAAgAHPAAAAX3JlbHMvLnJlbHNQSwECFAMUAAAACAAlFjVdsMQQ4XsAAACjAAAAEQAAAAAAAAAAAAAAgAGBAQAAd29yZC9kb2N1bWVudC54bWxQSwECFAMUAAAACAAlFjVddHZ+b5sAAAAHAQAAHAAAAAAAAAAAAAAAgAErAgAAd29yZC9fcmVscy9kb2N1bWVudC54bWwucmVsc1BLBQYAAAAABAAEAAMBAAAAAwAAAAA=", "base64");
const TEXT_PDF = Buffer.from("JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA1IDAgUiA+PiA+PiAvQ29udGVudHMgNCAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA1NSA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDcyIDcyMCBUZCAoQ29udGVudCBGYWN0b3J5IFBERiB0ZXh0KSBUaiBFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZGJqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI0MSAwMDAwMCBuIAowMDAwMDAwMzQ2IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNDI4CiUlRU9GCg==", "base64");
const BLANK_PDF = Buffer.from("JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA1IDAgUiA+PiA+PiAvQ29udGVudHMgNCAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCAwID4+CnN0cmVhbQoKZW5kc3RyZWFtCmVuZGJqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZGJqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQxIDAwMDAwIG4gCjAwMDAwMDI5MCAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjM2MAolJUVPRgo=", "base64");

async function workspace(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "content-factory-docs-"));
  t.after(async () => rm(root, { recursive: true, force: true }));
  const store = await openWorkspace(root);
  t.after(async () => store.close());
  return store;
}

test("CF-010 imports DOCX text with raw-object identity and extraction warnings", async t => {
  const store = await workspace(t);
  const result = await importDocxSource(store, { fileName: "说明.docx", bytes: DOCX });
  assert.equal(result.mediaType, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  assert.match(result.text, /标题/);
  assert.match(result.text, /正文 Content Factory/);
  assert.match(result.text, /单元格/);
  assert.ok(result.warnings.includes("TABLE_LINEARIZED"));
  assert.equal(store.getObjectRecord(result.rawSha256)?.sha256, result.rawSha256);
});

test("CF-010 rejects DOCX external relationships and decompression budget overflow", async t => {
  const store = await workspace(t);
  await assert.rejects(
    () => importDocxSource(store, { fileName: "external.docx", bytes: EXTERNAL_DOCX }),
    error => error?.code === "DOCUMENT_EXTERNAL_RELATIONSHIP_UNSUPPORTED"
  );
  await assert.rejects(
    () => importDocxSource(store, {
      fileName: "too-large.docx",
      bytes: DOCX,
      maxUncompressedBytes: 32
    }),
    error => error?.code === "DOCUMENT_UNCOMPRESSED_LIMIT"
  );
});

test("CF-010 imports text PDF with page locators and rejects scanned/empty PDF without OCR", async t => {
  const store = await workspace(t);
  const result = await importPdfSource(store, { fileName: "sample.pdf", bytes: TEXT_PDF });
  assert.equal(result.mediaType, "application/pdf");
  assert.equal(result.pages.length, 1);
  assert.equal(result.pages[0].page, 1);
  assert.match(result.pages[0].text, /Content Factory PDF text/);
  assert.match(result.text, /Content Factory PDF text/);

  await assert.rejects(
    () => importPdfSource(store, { fileName: "scan.pdf", bytes: BLANK_PDF }),
    error => error?.code === "DOCUMENT_TEXT_UNAVAILABLE"
      && error?.details?.ocrAttempted === false
  );
});

test("CF-010 rejects corrupt documents and explicit file-size overflow", async t => {
  const store = await workspace(t);
  await assert.rejects(
    () => importDocxSource(store, { fileName: "broken.docx", bytes: Buffer.from("not-a-zip") }),
    error => error?.code === "DOCUMENT_ARCHIVE_INVALID"
  );
  await assert.rejects(
    () => importPdfSource(store, { fileName: "broken.pdf", bytes: Buffer.from("%PDF broken") }),
    error => error?.code === "DOCUMENT_PARSE_FAILED"
  );
  await assert.rejects(
    () => importPdfSource(store, { fileName: "large.pdf", bytes: TEXT_PDF, maxBytes: 100 }),
    error => error?.code === "DOCUMENT_TOO_LARGE"
      && error?.details?.maxBytes === 100
  );
});
