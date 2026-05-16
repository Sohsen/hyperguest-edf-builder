/**
 * This script generates a map of the Peakwork XSD schemas and writes it to a JSON file.
 * It uses the `inspectPeakworkXsds` function to gather metadata about the XSDs,
 * then processes and writes this data to a specified output file.
 */

import * as fs from 'fs';
import * as path from 'path';
import { inspectPeakworkXsds, XsdMetadata, XsdComplexType, XsdAttribute, XsdElement } from './xsd-inspector';

const OUTPUT_PATH = 'reference/peakwork_edf_docs/schema_map.json';

/**
 * Sorts the XSD metadata to ensure a deterministic output.
 * It sorts files by path, complex types by name, and attributes/elements by name.
 * 
 * @param metadata - The array of XsdMetadata to sort.
 * @returns The sorted array of XsdMetadata.
 */
function sortMetadataDeterministically(metadata: XsdMetadata[]): XsdMetadata[] {
  // Sort attributes by name
  const sortAttributes = (attrs: XsdAttribute[]) => attrs.sort((a, b) => a.name.localeCompare(b.name));

  // Sort elements by name
  const sortElements = (elems: XsdElement[]) => elems.sort((a, b) => a.name.localeCompare(b.name));

  // Sort complex types by name and their internal properties
  const sortComplexTypes = (types: XsdComplexType[]) => {
    types.forEach(type => {
      sortAttributes(type.attributes);
      sortElements(type.elements);
    });
    return types.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Sort the top-level metadata array by filePath
  const sortedMetadata = metadata.sort((a, b) => a.filePath.localeCompare(b.filePath));

  // Sort the complex types within each file's metadata
  sortedMetadata.forEach(fileMeta => {
    sortComplexTypes(fileMeta.complexTypes);
  });

  return sortedMetadata;
}

/**
 * Runs the XSD inspection and writes the resulting schema map to a JSON file.
 * The output file is recreated on every run with pretty-printed, deterministic JSON.
 */
function writeSchemaMap() {
  try {
    console.log('Starting XSD inspection...');
    const metadata = inspectPeakworkXsds();
    
    console.log(`Found metadata for ${metadata.length} XSD files.`);

    // Ensure the output is always in the same order
    const sortedMetadata = sortMetadataDeterministically(metadata);

    const jsonOutput = JSON.stringify(sortedMetadata, null, 2);

    // Ensure the output directory exists
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, jsonOutput, 'utf-8');

    console.log(`Successfully wrote schema map to ${OUTPUT_PATH}`);

  } catch (error) {
    console.error('An error occurred while writing the schema map:', error);
  }
}

// Execute the script's main function.
writeSchemaMap();
