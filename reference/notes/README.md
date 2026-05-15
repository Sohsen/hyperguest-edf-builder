# HyperGuest EDF Builder Reference Package

This folder contains selected reference artifacts from the Python-generated recovery package.

Use this as reference/test data only. Do not replace the application source with these files.

Contents:
- `edf_samples/`: sample EDF XML outputs generated during previous Python work.
- `validation_reports/`: sample export validation reports.
- `ari_samples/`: ARI sample/readme artifacts found in the recovery package.

Recommended Gemini/Firebase prompt:

Analyze the current application against the files in `/reference`. Treat `/src` as the application source of truth and `/reference` only as sample/test data. Do not replace source code with reference files. Identify what logic or output behavior is missing from the current app compared with these samples.
