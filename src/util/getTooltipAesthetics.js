/**
 * Get standard tooltip aesthetics for gsm.viz compatibility
 * Matches the styling used across all gsm.viz/gsm.kri widgets
 * 
 * @returns {Object} Chart.js tooltip configuration object with styling properties
 */
export default function getTooltipAesthetics() {
    return {
        backgroundColor: 'rgba(255,255,255,.85)',
        bodyColor: 'black',
        bodyFont: {
            family: 'roboto',
            size: 12,
            weight: 'bold',
        },
        borderColor: 'black',
        borderWidth: 1,
        boxPadding: 5,
        boxWidth: 10,
        cornerRadius: 2,
        caretPadding: 4,
        padding: 10,
        titleColor: 'black',
        titleMarginBottom: 5,
        titleFont: {
            family: 'roboto',
            lineHeight: 1.5,
            size: 16,
            weight: 'bold',
        },
        usePointStyle: true,
    };
}

