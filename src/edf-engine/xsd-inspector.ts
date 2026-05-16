/**
 * This file contains the XSD Inspector, a utility for extracting metadata from XSD (XML Schema Definition) files.
 * It is designed to be run in a Node.js environment.
 *
 * The inspector provides the following capabilities:
 * - Recursively finds all .xsd files in the specified Peakwork documentation directory.
 * - For each XSD file, it extracts:
 *   - The names of all complexType elements.
 *   - The names of all required attributes within each complexType.
 *   - The names of all child elements within each complexType, along with their minOccurs and maxOccurs properties.
 * - The extracted metadata is returned as a structured object.
 */

import * as fs from 'fs';
import * as path from 'path';

// --- Interface Definitions for Structured Metadata ---

export interface XsdAttribute {
  name: string;
  required: boolean;
}

export interface XsdElement {
  name: string;
  minOccurs: string;
  maxOccurs: string;
}

export interface XsdComplexType {
  name: string;
  attributes: XsdAttribute[];
  elements: XsdElement[];
}

export interface XsdMetadata {
  filePath: string;
  complexTypes: XsdComplexType[];
}

// --- Core Extraction Logic ---

/**
 * Recursively discovers all XSD files in a given directory.
 *
 * @param dir - The directory to start searching from.
 * @returns An array of full file paths for all found .xsd files.
 */
const discoverXsdFiles = (dir: string): string[] => {
  let results: string[] = [];
  if (!fs.existsSync(dir)) {
    return [];
  }

  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(discoverXsdFiles(filePath));
    } else if (path.extname(filePath) === '.xsd') {
      results.push(filePath);
    }
  }

  return results;
};

/**
 * Extracts metadata from a single XSD file's content string using regular expressions.
 *
 * @param xsdContent - The string content of the XSD file.
 * @param filePath - The path of the file, for inclusion in the metadata.
 * @returns A structured metadata object for the XSD file.
 */
const extractMetadataFromString = (xsdContent: string, filePath: string): XsdMetadata => {
  const complexTypes: XsdComplexType[] = [];

  // Regex to find all complexType blocks with a name
  const complexTypeRegex = /<xs:complexType name="([^"]+)">(.*?)<\/xs:complexType>/gs;
  let complexTypeMatch;

  while ((complexTypeMatch = complexTypeRegex.exec(xsdContent)) !== null) {
    const [, name, innerContent] = complexTypeMatch;
    const attributes: XsdAttribute[] = [];
    const elements: XsdElement[] = [];

    // Regex to find attributes inside the complex type
    const attributeRegex = /<xs:attribute name="([^"]+)" use="([^"]+)"/g;
    let attributeMatch;
    while ((attributeMatch = attributeRegex.exec(innerContent)) !== null) {
      const [, attrName, use] = attributeMatch;
      attributes.push({ name: attrName, required: use === 'required' });
    }

    // Regex to find elements within a sequence/choice/all group
    const elementRegex = /<xs:element name="([^"]+)" minOccurs="([^"]+)" maxOccurs="([^"]+)"/g;
    let elementMatch;
    while ((elementMatch = elementRegex.exec(innerContent)) !== null) {
      const [, elemName, minOccurs, maxOccurs] = elementMatch;
      if (parseInt(minOccurs, 10) > 0) { // Only include required child elements
        elements.push({
          name: elemName,
          minOccurs,
          maxOccurs,
        });
      }
    }

    complexTypes.push({ name, attributes, elements });
  }

  return { filePath, complexTypes };
};

// --- Exported Function ---

/**
 * Inspects all Peakwork XSD files and returns their combined structured metadata.
 *
 * @returns An array of XsdMetadata objects, one for each processed file.
 */
export const inspectPeakworkXsds = (): XsdMetadata[] => {
  const docsPath = 'reference/peakwork_edf_docs/';
  const xsdFiles = discoverXsdFiles(docsPath);
  
  if (xsdFiles.length === 0) {
    console.warn(`No XSD files found in ${docsPath}`);
    return [];
  }

  const allMetadata = xsdFiles.map(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return extractMetadataFromString(content, filePath);
    } catch (error) {
      console.error(`Failed to read or parse XSD at ${filePath}:`, error);
      return { filePath, complexTypes: [] }; // Return empty metadata on error
    }
  });

  return allMetadata;
};
