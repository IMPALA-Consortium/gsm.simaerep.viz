/**
 * Convert hex color to rgba format with specified opacity
 * 
 * @param {string} hex - Hex color string (#RGB or #RRGGBB)
 * @param {number} opacity - Opacity value between 0 and 1 (default: 1.0)
 * @returns {string} RGBA color string in format 'rgba(r, g, b, opacity)'
 */
export default function hexToRgba(hex, opacity = 1.0) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Handle 3-character hex (#RGB)
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Return rgba string
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

