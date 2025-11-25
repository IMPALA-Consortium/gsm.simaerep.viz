HTMLWidgets.widget({
    name: 'Widget_Simaerep',
    type: 'output',
    factory: function(el, width, height) {
        return {
            renderValue: function(input) {
                if (input.bDebug)
                    console.log(input);

                // Helper function to convert R data frame (columns format) to array of objects (rows format)
                function convertRDataFrame(df) {
                    if (!df || typeof df !== 'object') return [];
                    
                    // Check if it's already in rows format (array of objects)
                    if (Array.isArray(df)) return df;
                    
                    // Convert from columns format to rows format
                    const keys = Object.keys(df);
                    if (keys.length === 0) return [];
                    
                    const firstKey = keys[0];
                    if (!Array.isArray(df[firstKey])) {
                        // Already a single object, wrap in array
                        return [df];
                    }
                    
                    const numRows = df[firstKey].length;
                    const rows = [];
                    
                    for (let i = 0; i < numRows; i++) {
                        const row = {};
                        keys.forEach(key => {
                            row[key] = df[key][i];
                        });
                        rows.push(row);
                    }
                    
                    return rows;
                }

                // Coerce `input.lChartConfig` to an object if it is not already.
                if (Object.prototype.toString.call(input.lChartConfig) !== '[object Object]') {
                    input.lChartConfig = {};
                }

                // Assign a unique ID to the element.
                el.id = `simaerep--${input.strStudyId}_${input.strScoreCol}`;

                // Prepare data structure for Simaerep chart (convert R data frames)
                const chartData = {
                    df_mean_study: convertRDataFrame(input.df_mean_study),
                    df_mean_group_flagged: convertRDataFrame(input.df_mean_group_flagged),
                    df_mean_group_not_flagged: convertRDataFrame(input.df_mean_group_not_flagged),
                    df_label_sites: convertRDataFrame(input.df_label_sites)
                };

                // Configure chart
                const chartConfig = {
                    selectedGroupIDs: input.lChartConfig.selectedGroupIDs || 'None',
                    aspectRatio: input.lChartConfig.aspectRatio || 2,
                    showGroupSelector: input.bAddGroupSelect !== false,
                    width: width,
                    height: height,
                    groupLabelKey: 'GroupID'
                };

                // Generate simaerep chart
                const instance = new gsmSimaerepViz.Simaerep(
                    el,
                    chartData,
                    chartConfig
                );

                // Store instance for later access
                el.chartInstance = instance;
            },
            resize: function(width, height) {
                // Handle resize if needed
                if (el.chartInstance) {
                    el.chartInstance.data.config.width = width;
                    el.chartInstance.data.config.height = height;
                    el.chartInstance.render();
                }
            }
        };
    }
});
