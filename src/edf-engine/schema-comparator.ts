/**
 * This script provides functionality to compare generated EDF XML files against a predefined schema map.
 * It is designed to be run in a Node.js environment.
 *
 * The primary purpose is to validate the structure of XML output by:
 * 1. Parsing all `.xml` files found in a specified directory.
 * 2. Loading a trusted schema map generated from the original XSDs.
 * 3. Recursively comparing the XML structure against the schema, checking for:
 *    - Missing required elements and attributes.
 *    - Unexpected elements and attributes not defined in the schema.
 *    - Elements that violate the defined parent-child hierarchy.
 * 4. Producing a consolidated, structured report of all discrepancies found.
 */

import * as fs from 'fs';
import * as path from 'path';
import { XsdMetadata } from './xsd-inspector';

// --- Configuration ---
const SCHEMA_MAP_PATH = 'reference/peakwork_edf_docs/schema_map.json';
const XML_FILES_DIR = 'tmp/edf-engine-smoke/';

// --- Interfaces for Report and internal XML representation ---

export interface DiscrepancyReport {
  valid: boolean;
  missingElements: string[];
  missingAttributes: string[];
  unexpectedElements: string[];
  hierarchyViolations: string[];
  filesChecked: string[];
}

interface XmlNode {
  tagName: string;
  attributes: { [key: string]: string };
  children: XmlNode[];
  parent?: XmlNode;
}

// --- Core Comparison Logic ---

/**
 * Orchestrates the comparison of generated XML files against the master schema.
 *
 * @returns A structured report detailing any discrepancies found.
 */
export function compareGeneratedXmlAgainstSchema(): DiscrepancyReport {
  const report: DiscrepancyReport = {
    valid: true,
    missingElements: [],
    missingAttributes: [],
    unexpectedElements: [],
    hierarchyViolations: [],
    filesChecked: [],
  };

  if (!fs.existsSync(XML_FILES_DIR)) {
    console.warn(`XML directory not found, skipping comparison: ${XML_FILES_DIR}`);
    return report; // Return a default, valid report
  }

  const schema = loadSchema();
  const xmlFiles = findXmlFiles(XML_FILES_DIR);
  report.filesChecked = xmlFiles;

  for (const file of xmlFiles) {
    try {
      const xmlContent = fs.readFileSync(file, 'utf-8');
      const xmlTree = parseXml(xmlContent);

      if (xmlTree) {
        // Start comparison from the root XML element
        compareNode(xmlTree, schema, report, file);
      }
    } catch (e: any) {
      report.valid = false;
      report.hierarchyViolations.push(`File ${file}: Failed to parse or compare - ${e.message}`);
    }
  }
  
  // Final validity check
  report.valid = report.missingElements.length === 0 && 
                 report.missingAttributes.length === 0 && 
                 report.unexpectedElements.length === 0 && 
                 report.hierarchyViolations.length === 0;

  return report;
}


// --- Helper Functions ---

/**
 * Loads and parses the schema map from its JSON file.
 */
function loadSchema(): XsdMetadata[] {
  if (!fs.existsSync(SCHEMA_MAP_PATH)) {
    throw new Error(`Schema map not found at ${SCHEMA_MAP_PATH}`);
  }
  const schemaContent = fs.readFileSync(SCHEMA_MAP_PATH, 'utf-8');
  return JSON.parse(schemaContent) as XsdMetadata[];
}

/**
 * Recursively finds all `.xml` files in a directory.
 */
function findXmlFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findXmlFiles(filePath));
    } else if (path.extname(filePath) === '.xml') {
      results.push(filePath);
    }
  }
  return results;
}

/**
 * A lightweight, stack-based XML parser to create a tree structure.
 * Note: This is a simplified parser and may not handle all XML complexities.
 */
function parseXml(xmlString: string): XmlNode | null {
  const stack: XmlNode[] = [];
  let root: XmlNode | null = null;

  // Basic regex for tags; may not cover all edge cases like CDATA or comments
  const tagRegex = /<(\/)?([a-zA-Z0-9_:]+)([^>]*)>/g;
  let match;

  let lastIndex = 0;

  while ((match = tagRegex.exec(xmlString)) !== null) {
    const [fullMatch, isClosing, tagName, attrText] = match;

    if (isClosing) {
      if (stack.length > 0) {
        stack.pop(); // Go up one level
      }
    } else {
      const attributes = (attrText || '').split(/\s+/)
        .filter(part => part.includes('='))
        .reduce((acc, part) => {
          const [key, value] = part.split(/=(.*)/s);
          if (key) acc[key] = value.replace(/['|"]/g, '');
          return acc;
        }, {} as { [key: string]: string });

      const newNode: XmlNode = {
        tagName,
        attributes,
        children: [],
        parent: stack.length > 0 ? stack[stack.length - 1] : undefined,
      };

      if (stack.length > 0) {
        stack[stack.length - 1].children.push(newNode);
      } else {
        root = newNode; // This is the root element
      }
      stack.push(newNode);
    }
    lastIndex = tagRegex.lastIndex;
  }
  return root;
}

/**
 * Recursively compares an XML node against the schema definitions.
 */
function compareNode(xmlNode: XmlNode, schema: XsdMetadata[], report: DiscrepancyReport, filePath: string) {
  // Find the schema definition for the current XML node's tag
  const complexType = findComplexType(xmlNode.tagName, schema);

  if (!complexType) {
    report.unexpectedElements.push(`File ${filePath}: Found unexpected element <${xmlNode.tagName}> which is not defined in any schema.`);
    return; // Stop checking this branch if the container is unknown
  }

  // 1. Check for missing required attributes
  for (const schemaAttr of complexType.attributes) {
    if (schemaAttr.required && !xmlNode.attributes[schemaAttr.name]) {
      report.missingAttributes.push(`File ${filePath}: Element <${xmlNode.tagName}> is missing required attribute '${schemaAttr.name}'.`);
    }
  }

  // 2. Check for unexpected attributes
  for (const xmlAttrName in xmlNode.attributes) {
    if (!complexType.attributes.some(sa => sa.name === xmlAttrName)) {
      report.unexpectedElements.push(`File ${filePath}: Element <${xmlNode.tagName}> has unexpected attribute '${xmlAttrName}'.`);
    }
  }

  // 3. Check for missing required child elements
  for (const schemaElement of complexType.elements) {
    if (schemaElement.minOccurs === '1' && !xmlNode.children.some(c => c.tagName === schemaElement.name)) {
      report.missingElements.push(`File ${filePath}: Element <${xmlNode.tagName}> is missing required child element <${schemaElement.name}>.`);
    }
  }

  // 4. Recursively check child nodes
  for (const childNode of xmlNode.children) {
    const childSchemaDef = findComplexType(childNode.tagName, schema);
    const parentAllowsChild = complexType.elements.some(se => se.name === childNode.tagName);

    if (!parentAllowsChild) {
        // Check if the child is a valid complex type somewhere else, but just in the wrong place.
        if (childSchemaDef) {
            report.hierarchyViolations.push(`File ${filePath}: Element <${childNode.tagName}> is not a valid child of <${xmlNode.tagName}>.`);
        } else {
             // If not a known complex type at all, it's unexpected.
            report.unexpectedElements.push(`File ${filePath}: Found unexpected element <${childNode.tagName}> inside <${xmlNode.tagName}>.`);
        }
    } else {
        // The child is allowed, so we recurse
        compareNode(childNode, schema, report, filePath);
    }
  }
}

/**
 * Finds the definition for a complexType by its name across all schema files.
 */
function findComplexType(name: string, schema: XsdMetadata[]) {
  for (const file of schema) {
    const type = file.complexTypes.find(ct => ct.name === name);
    if (type) return type;
  }
  return null;
}
