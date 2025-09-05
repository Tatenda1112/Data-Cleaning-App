import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider,
  Card,
  CardContent,
  Switch,
  Slider
} from '@mui/material';
import {
  ExpandMore,
  Save,
  Refresh,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
import axios from 'axios';

const DataConfig = ({ columns = [], onConfigUpdate, onRunChecks }) => {
  const [config, setConfig] = useState({});
  const [availableChecks, setAvailableChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedChecks, setExpandedChecks] = useState({});

  useEffect(() => {
    loadDefaultConfig();
    loadAvailableChecks();
  }, []);

  const loadDefaultConfig = async () => {
    try {
      const response = await axios.get('http://localhost:8000/config/default');
      setConfig(response.data);
    } catch (error) {
      console.error('Failed to load default config:', error);
    }
  };

  const loadAvailableChecks = async () => {
    try {
      const response = await axios.get('http://localhost:8000/config/available-checks');
      setAvailableChecks(response.data);
    } catch (error) {
      console.error('Failed to load available checks:', error);
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNestedConfigChange = (parentKey, childKey, value) => {
    setConfig(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
  };

  const handleArrayConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveConfiguration = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/configure-checks', config);
      setMessage(response.data.message);
      if (onConfigUpdate) {
        onConfigUpdate(config);
      }
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runDataChecks = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/identify-issues');
      setMessage(response.data.message);
      if (onRunChecks) {
        onRunChecks();
      }
    } catch (error) {
      setMessage(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheckExpansion = (checkName) => {
    setExpandedChecks(prev => ({
      ...prev,
      [checkName]: !prev[checkName]
    }));
  };

  const renderColumnMultiSelect = (label, key, value = []) => (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={(e) => handleArrayConfigChange(key, e.target.value)}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((col) => (
              <Chip key={col} label={col} size="small" />
            ))}
          </Box>
        )}
      >
        {columns.map((col) => (
          <MenuItem key={col} value={col}>
            {col}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const renderTextField = (label, key, value, type = 'text') => (
    <TextField
      fullWidth
      label={label}
      value={value || ''}
      onChange={(e) => handleConfigChange(key, e.target.value)}
      type={type}
      size="small"
    />
  );

  const renderNumberField = (label, key, value, min = 0, max = 100) => (
    <TextField
      fullWidth
      label={label}
      value={value || ''}
      onChange={(e) => handleConfigChange(key, parseFloat(e.target.value) || 0)}
      type="number"
      inputProps={{ min, max, step: 0.1 }}
      size="small"
    />
  );

  const renderSlider = (label, key, value, min = 0, max = 1, step = 0.01) => (
    <Box>
      <Typography gutterBottom>{label}: {value || 0}</Typography>
      <Slider
        value={value || 0}
        onChange={(e, newValue) => handleConfigChange(key, newValue)}
        min={min}
        max={max}
        step={step}
        marks={[
          { value: min, label: min.toString() },
          { value: max, label: max.toString() }
        ]}
      />
    </Box>
  );

  const renderCheckSection = (check) => {
    const isExpanded = expandedChecks[check.name] || false;
    
    return (
      <Accordion 
        key={check.name} 
        expanded={isExpanded}
        onChange={() => toggleCheckExpansion(check.name)}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="primary" />
            <Typography variant="h6">{check.name}</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {check.description}
          </Typography>
          
          {check.config_fields.map((field) => {
            switch (field) {
              case 'mandatory_columns':
                return (
                  <Box key={field} sx={{ mb: 2 }}>
                    {renderColumnMultiSelect('Mandatory Columns', field, config[field] || [])}
                  </Box>
                );
              
              case 'text_columns':
                return (
                  <Box key={field} sx={{ mb: 2 }}>
                    {renderColumnMultiSelect('Text Columns', field, config[field] || [])}
                  </Box>
                );
              
              case 'numeric_columns':
                return (
                  <Box key={field} sx={{ mb: 2 }}>
                    {renderColumnMultiSelect('Numeric Columns', field, config[field] || [])}
                  </Box>
                );
              
              case 'date_columns':
                return (
                  <Box key={field} sx={{ mb: 2 }}>
                    {renderColumnMultiSelect('Date Columns', field, config[field] || [])}
                  </Box>
                );
              
              case 'duplicate_key_columns':
                return (
                  <Box key={field} sx={{ mb: 2 }}>
                    {renderColumnMultiSelect('Duplicate Key Columns', field, config[field] || [])}
                  </Box>
                );
              
              case 'id_column':
                return (
                  <Box key={field} sx={{ mb: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>ID Column</InputLabel>
                      <Select
                        value={config[field] || ''}
                        onChange={(e) => handleConfigChange(field, e.target.value)}
                      >
                        <MenuItem value="">None</MenuItem>
                        {columns.map((col) => (
                          <MenuItem key={col} value={col}>
                            {col}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                );
              
              case 'case_standardization':
                return (
                  <Box key={field} sx={{ mb: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Case Standardization</InputLabel>
                      <Select
                        value={config[field] || 'upper'}
                        onChange={(e) => handleConfigChange(field, e.target.value)}
                      >
                        <MenuItem value="upper">UPPER</MenuItem>
                        <MenuItem value="lower">lower</MenuItem>
                        <MenuItem value="title">Title Case</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                );
              
              case 'constant_value_threshold':
                return (
                  <Box key={field} sx={{ mb: 2 }}>
                    {renderSlider('Constant Value Threshold', field, config[field], 0, 1, 0.01)}
                  </Box>
                );
              
              case 'year_filter':
                return (
                  <Card key={field} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Year Filter</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Date Column</InputLabel>
                            <Select
                              value={config[field]?.date_column || ''}
                              onChange={(e) => handleNestedConfigChange(field, 'date_column', e.target.value)}
                            >
                              <MenuItem value="">None</MenuItem>
                              {columns.map((col) => (
                                <MenuItem key={col} value={col}>
                                  {col}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          {renderNumberField('Start Year', 'start_year', config[field]?.start_year, 1900, 2100)}
                        </Grid>
                        <Grid item xs={12} md={3}>
                          {renderNumberField('End Year', 'end_year', config[field]?.end_year, 1900, 2100)}
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                );
              
              case 'start_end_year':
                return (
                  <Card key={field} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Start/End Year Comparison</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Start Year Column</InputLabel>
                            <Select
                              value={config[field]?.start_year_column || ''}
                              onChange={(e) => handleNestedConfigChange(field, 'start_year_column', e.target.value)}
                            >
                              <MenuItem value="">None</MenuItem>
                              {columns.map((col) => (
                                <MenuItem key={col} value={col}>
                                  {col}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>End Year Column</InputLabel>
                            <Select
                              value={config[field]?.end_year_column || ''}
                              onChange={(e) => handleNestedConfigChange(field, 'end_year_column', e.target.value)}
                            >
                              <MenuItem value="">None</MenuItem>
                              {columns.map((col) => (
                                <MenuItem key={col} value={col}>
                                  {col}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                );
              
              case 'outlier_detection':
                return (
                  <Card key={field} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Outlier Detection</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          {renderColumnMultiSelect('Columns', 'columns', config[field]?.columns || [])}
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth>
                            <InputLabel>Method</InputLabel>
                            <Select
                              value={config[field]?.method || 'iqr'}
                              onChange={(e) => handleNestedConfigChange(field, 'method', e.target.value)}
                            >
                              <MenuItem value="iqr">IQR</MenuItem>
                              <MenuItem value="zscore">Z-Score</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          {renderNumberField('Threshold', 'threshold', config[field]?.threshold, 0.1, 5, 0.1)}
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                );
              
              case 'cross_field_rules':
                return (
                  <Box key={field} sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Cross-Field Rules</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Rules (one per line)"
                      value={(config[field] || []).join('\n')}
                      onChange={(e) => handleArrayConfigChange(field, e.target.value.split('\n').filter(r => r.trim()))}
                      placeholder="Example: column1 > column2&#10;column3 != 'invalid'"
                    />
                  </Box>
                );
              
              case 'category_validation':
                return (
                  <Box key={field} sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Category Validation</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Column: Expected Values (JSON format)"
                      value={JSON.stringify(config[field] || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          handleConfigChange(field, parsed);
                        } catch (err) {
                          // Invalid JSON, keep as is
                        }
                      }}
                      placeholder='{"status": ["active", "inactive"], "type": ["A", "B", "C"]}'
                    />
                  </Box>
                );
              
              case 'unique_id_generation':
                return (
                  <Card key={field} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Unique ID Generation</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="ID Column Name"
                            value={config[field]?.id_column || ''}
                            onChange={(e) => handleNestedConfigChange(field, 'id_column', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          {renderColumnMultiSelect('Columns to Concatenate', 'columns_to_concat', config[field]?.columns_to_concat || [])}
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                );
              
              case 'columns_to_keep':
                return (
                  <Box key={field} sx={{ mb: 2 }}>
                    {renderColumnMultiSelect('Columns to Keep', field, config[field] || [])}
                  </Box>
                );
              
              default:
                return null;
            }
          })}
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Data Quality Configuration
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Configure which columns to check and what data quality rules to apply.
      </Typography>

      {message && (
        <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Available Checks
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select and configure the data quality checks you want to run.
            </Typography>
            
            {availableChecks.map(renderCheckSection)}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={saveConfiguration}
                disabled={loading}
                fullWidth
              >
                Save Configuration
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadDefaultConfig}
                disabled={loading}
                fullWidth
              >
                Reset to Defaults
              </Button>
              
              <Divider />
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckCircle />}
                onClick={runDataChecks}
                disabled={loading}
                fullWidth
                size="large"
              >
                Run Data Checks
              </Button>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Data Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Columns: {columns.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configured Checks: {Object.keys(config).length}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DataConfig;
