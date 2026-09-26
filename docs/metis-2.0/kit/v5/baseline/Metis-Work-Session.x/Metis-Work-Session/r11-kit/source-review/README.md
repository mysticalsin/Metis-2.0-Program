# Read the source, not just the diagram

Source: uploaded 1.9.5 text export, 1,521 FILE sections; actual Git SHA unknown. This is a full computational inventory and targeted inspection, not an exhaustive audit.

Five linked implementations are NOT_IN_EXPORT:

- `src/renderer/src/App.tsx`
- `src/main/index.ts`
- `src/renderer/src/lib/listen.ts`
- `src/main/transcripts.ts`
- `src/main/brain/ingest.ts`

Retrieve the real checkout before claiming wiring or running builds. Use FINDINGS.md for 24 concrete corrections and SOURCE-INDEX.json for scoped navigation. The raw source export is not redistributed in this kit: it may include confidential code, security material or generated assets that are not needed to execute the handoff. Keep the original user-supplied file beside the kit, or use the authorized repository.

Source-section digests normalize line endings to LF and include one terminal newline. They identify this export, not guaranteed original Git blobs. Do not compare them to Git SHA-1.

The original map is preserved; CURRENT-RECONCILED and TARGET are respectively source-awareness and proposed architecture. Neither is live deployment proof.


## Bundled source snapshot

The supplied text export is included at `references/source/metis-1.9.5-export.txt` with its original hash. It is reference-only and incomplete, not a buildable source checkout. Use the actual authorized repository for implementation; never execute or auto-provision from the export.
