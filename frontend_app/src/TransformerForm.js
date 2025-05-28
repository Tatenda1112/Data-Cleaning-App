import React from 'react';
import {
    Box,
    Typography,
    TextField,
    FormControl,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Button,
    Divider,
    Tooltip,
    Card,
    CardContent,
} from '@mui/material';

function TransformerForm({ transformer, columns, onConfigChange }) {
    const { transformer_name, config } = transformer;

    const toggleSelectAllColumns = (configKey, selectAll) => {
        onConfigChange(configKey, selectAll ? columns : []);
    };

    const handleColumnSelection = (configKey, column, checked) => {
        const selectedColumns = config[configKey] || [];
        const updatedColumns = checked
            ? [...selectedColumns, column]
            : selectedColumns.filter((col) => col !== column);
        onConfigChange(configKey, updatedColumns);
    };

    const renderColumnSelection = (title, configKey) => (
        <Box mt={2}>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1, fontWeight: 'bold' }}>
                {title}
            </Typography>
            <FormGroup row sx={{ gap: 1 }}>
                {columns.map((column) => (
                    <FormControlLabel
                        key={column}
                        control={
                            <Checkbox
                                checked={config[configKey]?.includes(column) || false}
                                onChange={(e) => handleColumnSelection(configKey, column, e.target.checked)}
                                color="primary"
                            />
                        }
                        label={column}
                        sx={{ textTransform: 'capitalize', fontSize: '0.875rem' }}
                    />
                ))}
            </FormGroup>
            <Box display="flex" gap={2} mt={2}>
                <Tooltip title="Select all columns" arrow>
                    <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => toggleSelectAllColumns(configKey, true)}
                    >
                        Select All
                    </Button>
                </Tooltip>
                <Tooltip title="Deselect all columns" arrow>
                    <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => toggleSelectAllColumns(configKey, false)}
                    >
                        Deselect All
                    </Button>
                </Tooltip>
            </Box>
        </Box>
    );

    return (
        <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2 }}>
                    {transformer_name.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <FormControl component="fieldset" fullWidth>
                    {transformer_name === 'mandatory_columns' &&
                        renderColumnSelection('Choose Mandatory Columns:', 'mandatory_columns')}
                    {transformer_name === 'numeric_converter' &&
                        renderColumnSelection('Select Columns for Numeric Conversion:', 'columns')}
                    {transformer_name === 'negative_zero_checker' &&
                        renderColumnSelection('Select Columns for Negative/Zero Check:', 'columns')}
                    {transformer_name === 'duplicate_identifier' &&
                        renderColumnSelection('Select Columns for Duplicate Check:', 'columns')}
                    {transformer_name === 'unique_id_generator' &&
                        renderColumnSelection('Select Columns to Concatenate for Unique ID:', 'columns_to_concat')}
                    {transformer_name === 'date_converter' &&
                        renderColumnSelection('Select Columns for Date Conversion:', 'columns')}
                    {transformer_name === 'column_filter' &&
                        renderColumnSelection('Select Columns to Keep:', 'columns_to_keep')}

                    {transformer_name === 'id_validator' && (
                        <Box mt={2}>
                            <TextField
                                select
                                fullWidth
                                label="Select ID Column"
                                value={config.id_column || ''}
                                onChange={(e) => onConfigChange('id_column', e.target.value)}
                                SelectProps={{ native: true }}
                                margin="normal"
                                variant="outlined"
                            >
                                <option value=""></option>
                                {columns.map((column) => (
                                    <option key={column} value={column}>
                                        {column}
                                    </option>
                                ))}
                            </TextField>
                        </Box>
                    )}

                    {transformer_name === 'column_name_cleaner' && (
                        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 2, fontStyle: 'italic' }}>
                            Automatically cleans column names.
                        </Typography>
                    )}
                </FormControl>
            </CardContent>
        </Card>
    );
}

export default TransformerForm;