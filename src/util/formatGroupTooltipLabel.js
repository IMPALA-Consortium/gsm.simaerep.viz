/**
 * Format group attributes for tooltip display.
 * 
 * Automatically formats metadata keys and values for tooltip content.
 * - Converts camelCase to Title Case
 * - Replaces underscores with spaces
 * - Filters out internal fields
 * 
 * @param {Object} group - Group metadata object (e.g., { Country: "USA", Status: "Active" })
 * @param {Object} config - Configuration object
 *   Optional: config.groupTooltipKeys - Object mapping field names to labels
 *
 * @returns {Array<string>} Array of formatted tooltip lines (e.g., ["Country: USA", "Status: Active"])
 */
export default function formatGroupTooltipLabel(group, config) {
    if (!group) {
        return [];
    }

    // Format group attribute keys if unspecified.
    const tooltipKeys = ![null, undefined].includes(config.groupTooltipKeys)
        ? config.groupTooltipKeys
        : Object.keys(group)
            // remove internal fields from the tooltip
            .filter((key) => ['groupLabel', 'GroupLabel', 'nRedFlags', 'nAmberFlags', 'nGreenFlags', 'ParticipantCount'].includes(key) === false)
            .reduce((acc, key) => {
                // title-case key:
                // - replace underscores with spaces
                // - insert spaces between camelCase words
                // - capitalize first letter of each word
                // - replace 'Id' with 'ID', 'invid' with 'ID'
                const label = key
                    .replace(/_/g, ' ')
                    .replace(/([a-z])([A-Z])/g, '$1 $2')
                    .replace(/\b\w/g, (char) => char.toUpperCase())
                    .replace(/\bId\b/g, 'ID')
                    .replace(/\bInvid\b/i, 'Investigator ID');

                acc[key] = label;

                return acc;
            }, {});

    // Map group attributes to tooltip content.
    const tooltipContent = [];
    for (const [key, label] of Object.entries(tooltipKeys)) {
        if (group[key] !== undefined && group[key] !== null && group[key] !== '') {
            let value = group[key];

            tooltipContent.push(`${label}: ${value}`);
        }
    }

    return tooltipContent;
}

