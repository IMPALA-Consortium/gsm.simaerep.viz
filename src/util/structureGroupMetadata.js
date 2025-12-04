import { rollup } from 'd3';

/**
 * Purpose: Create a metadata object for each group ID in the input dataset.
 * 
 * Converts group metadata from Param/Value format to structured objects:
 * Input:  [{ GroupID: "S001", Param: "Country", Value: "USA", GroupLevel: "Site" }, ...]
 * Output: Map({ "S001": { Country: "USA", ... } })
 *
 * @param {Array} groupMetadata - an array of objects containing group metadata
 *   with columns: GroupID, Param, Value, GroupLevel
 * @param {Object} config - chart configuration and metadata
 *   requires config.GroupLevel (e.g., "Site", "Country", "Study")
 *
 * @returns {Map|null} - a Map of metadata objects keyed by GroupID for the specified GroupLevel,
 *   or null if groupMetadata is null or GroupLevel not found
 */
export default function structureGroupMetadata(groupMetadata, config) {
    if (groupMetadata === null || groupMetadata === undefined) return null;
    if (!Array.isArray(groupMetadata) || groupMetadata.length === 0) return null;

    const structuredGroupMetadata = rollup(
        groupMetadata,
        (group) =>
            group.reduce((acc, cur) => {
                acc[cur.Param] = cur.Value;
                return acc;
            }, {}),
        (d) => d.GroupLevel,
        (d) => d.GroupID
    );

    const keys = Array.from(structuredGroupMetadata.keys());
    const groupLevel = config.GroupLevel || 'Site';

    if (keys.includes(groupLevel)) {
        return structuredGroupMetadata.get(groupLevel);
    } else {
        console.warn(
            `Group level "${groupLevel}" not found in group metadata. Available levels: ${keys.join(', ')}`
        );

        return null;
    }
}

