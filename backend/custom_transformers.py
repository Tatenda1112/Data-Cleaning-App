import pandas as pd
import numpy as np
import re
from sklearn.base import BaseEstimator, TransformerMixin
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')


class ImportDataTransformer(BaseEstimator, TransformerMixin):
    """Import data from CSV, Excel, or Parquet files."""
    def __init__(self, file_path=None):
        self.file_path = file_path
        self.file_readers = {
            ".csv": pd.read_csv,
            ".xlsx": pd.read_excel,
            ".parquet": pd.read_parquet,
        }

    def fit(self, X=None, y=None):
        return self

    def transform(self, X=None):
        if not self.file_path:
            print("No file path provided, returning empty DataFrame.")
            return pd.DataFrame()

        file_extension = self.file_path.split(".")[-1]
        read_function = self.file_readers.get(f".{file_extension}")

        if not read_function:
            raise ValueError("Unsupported file format! Please use CSV, XLSX, or Parquet.")

        data = read_function(self.file_path)
        print(f"Data imported from {self.file_path}")
        return data


class ColumnNameCleaner(BaseEstimator, TransformerMixin):
    """Clean column names by removing special characters and standardizing format."""
    def __init__(self):
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        original_columns = X.columns.tolist()
        cleaned_columns = []
        
        for col in original_columns:
            # Remove special characters, replace spaces with underscores, convert to lowercase
            cleaned = re.sub(r'[^a-zA-Z0-9_]', '_', str(col))
            cleaned = re.sub(r'_+', '_', cleaned)  # Replace multiple underscores with single
            cleaned = cleaned.strip('_').lower()
            cleaned_columns.append(cleaned)
        
        X.columns = cleaned_columns
        
        # Record changes
        changes = []
        for orig, new in zip(original_columns, cleaned_columns):
            if orig != new:
                changes.append({'Original': orig, 'Cleaned': new})
        
        if changes:
            self.errors = pd.DataFrame(changes)
        
        return X


class MandatoryColumnsChecker(BaseEstimator, TransformerMixin):
    """Check for missing mandatory columns."""
    def __init__(self, mandatory_columns=None):
        self.mandatory_columns = mandatory_columns if mandatory_columns else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        missing_columns = [col for col in self.mandatory_columns if col not in X.columns]
        if missing_columns:
            self.errors = pd.DataFrame({
                'Missing_Columns': missing_columns,
                'Check': 'MandatoryColumnsChecker'
            })
        return X


class WhitespaceCaseCleaner(BaseEstimator, TransformerMixin):
    """Clean whitespace and standardize case in text columns."""
    def __init__(self, columns=None, case='upper'):
        self.columns = columns if columns else []
        self.case = case
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        issues = []
        for col in self.columns:
            if col in X.columns:
                original_values = X[col].astype(str)
                # Strip whitespace
                cleaned_values = original_values.str.strip()
                # Apply case conversion
                if self.case == 'upper':
                    cleaned_values = cleaned_values.str.upper()
                elif self.case == 'lower':
                    cleaned_values = cleaned_values.str.lower()
                elif self.case == 'title':
                    cleaned_values = cleaned_values.str.title()
                
                # Count changes
                changes = (original_values != cleaned_values).sum()
                if changes > 0:
                    issues.append({
                        'Column': col,
                        'Changes_Made': changes,
                        'Check': 'WhitespaceCaseCleaner'
                    })
                
                X[col] = cleaned_values
        
        if issues:
            self.errors = pd.DataFrame(issues)
        return X


class RemoveUnwantedCharacters(BaseEstimator, TransformerMixin):
    """Remove unwanted characters from specified columns."""
    def __init__(self, columns=None, unwanted_chars=None):
        self.columns = columns if columns else []
        self.unwanted_chars = unwanted_chars if unwanted_chars else ['\n', '\r', '\t']
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        issues = []
        for col in self.columns:
            if col in X.columns:
                original_values = X[col].astype(str)
                cleaned_values = original_values
                
                for char in self.unwanted_chars:
                    cleaned_values = cleaned_values.str.replace(char, '', regex=False)
                
                # Count changes
                changes = (original_values != cleaned_values).sum()
                if changes > 0:
                    issues.append({
                        'Column': col,
                        'Characters_Removed': changes,
                        'Check': 'RemoveUnwantedCharacters'
                    })
                
                X[col] = cleaned_values
        
        if issues:
            self.errors = pd.DataFrame(issues)
        return X


class NumericConverter(BaseEstimator, TransformerMixin):
    """Convert specified columns to numeric, logging conversion failures."""
    def __init__(self, columns=None):
        self.columns = columns if columns else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        issues = []
        for col in self.columns:
            if col in X.columns:
                original_values = X[col].copy()
                # Convert to numeric, coercing errors to NaN
                X[col] = pd.to_numeric(X[col], errors='coerce')
                
                # Count conversion failures
                failures = X[col].isna().sum() - original_values.isna().sum()
                if failures > 0:
                    issues.append({
                        'Column': col,
                        'Conversion_Failures': failures,
                        'Check': 'NumericConverter'
                    })
        
        if issues:
            self.errors = pd.DataFrame(issues)
        return X


class DateConverter(BaseEstimator, TransformerMixin):
    """Convert specified columns to datetime, logging conversion errors."""
    def __init__(self, columns=None, date_format=None):
        self.columns = columns if columns else []
        self.date_format = date_format
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        issues = []
        for col in self.columns:
            if col in X.columns:
                original_values = X[col].copy()
                
                if self.date_format:
                    X[col] = pd.to_datetime(X[col], format=self.date_format, errors='coerce')
                else:
                    X[col] = pd.to_datetime(X[col], errors='coerce')
                
                # Count conversion failures
                failures = X[col].isna().sum() - original_values.isna().sum()
                if failures > 0:
                    issues.append({
                        'Column': col,
                        'Date_Conversion_Failures': failures,
                        'Check': 'DateConverter'
                    })
        
        if issues:
            self.errors = pd.DataFrame(issues)
        return X


class MissingValuesDetector(BaseEstimator, TransformerMixin):
    """Detect and flag rows with missing values."""
    def __init__(self, columns=None):
        self.columns = columns if columns else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if not self.columns:
            # Check all columns
            missing_mask = X.isnull().any(axis=1)
        else:
            # Check only specified columns
            missing_mask = X[self.columns].isnull().any(axis=1)
        
        if missing_mask.any():
            missing_rows = X[missing_mask].copy()
            missing_rows['Row_Index'] = missing_rows.index
            missing_rows['Check'] = 'MissingValuesDetector'
            self.errors = missing_rows
        
        return X


class IDValidator(BaseEstimator, TransformerMixin):
    """Validate ID columns for missing or invalid values."""
    def __init__(self, id_column=None):
        self.id_column = id_column
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if not self.id_column or self.id_column not in X.columns:
            return X
        
        issues = []
        id_series = X[self.id_column]
        
        # Check for missing IDs
        missing_ids = id_series.isnull().sum()
        if missing_ids > 0:
            issues.append({
                'Column': self.id_column,
                'Missing_IDs': missing_ids,
                'Check': 'IDValidator'
            })
        
        # Check for empty string IDs
        empty_ids = (id_series.astype(str).str.strip() == '').sum()
        if empty_ids > 0:
            issues.append({
                'Column': self.id_column,
                'Empty_IDs': empty_ids,
                'Check': 'IDValidator'
            })
        
        if issues:
            self.errors = pd.DataFrame(issues)
        return X


class NegativeZeroChecker(BaseEstimator, TransformerMixin):
    """Check for negative or zero values in numeric columns."""
    def __init__(self, columns=None):
        self.columns = columns if columns else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        issues = []
        for col in self.columns:
            if col in X.columns and pd.api.types.is_numeric_dtype(X[col]):
                # Check for negative values
                negative_count = (X[col] < 0).sum()
                # Check for zero values
                zero_count = (X[col] == 0).sum()
                
                if negative_count > 0 or zero_count > 0:
                    issues.append({
                        'Column': col,
                        'Negative_Values': negative_count,
                        'Zero_Values': zero_count,
                        'Check': 'NegativeZeroChecker'
                    })
        
        if issues:
            self.errors = pd.DataFrame(issues)
        return X


class DuplicatesFromtheData(BaseEstimator, TransformerMixin):
    """Detect fully duplicated rows."""
    def __init__(self):
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        duplicated_mask = X.duplicated(keep=False)
        if duplicated_mask.any():
            duplicated_rows = X[duplicated_mask].copy()
            duplicated_rows['Row_Index'] = duplicated_rows.index
            duplicated_rows['Check'] = 'DuplicatesFromtheData'
            self.errors = duplicated_rows
        
        return X


class DuplicateIdentifier(BaseEstimator, TransformerMixin):
    """Detect duplicate rows based on key columns."""
    def __init__(self, columns=None):
        self.columns = columns if columns else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if not self.columns:
            return X
        
        # Check for duplicates in specified columns
        duplicated_mask = X.duplicated(subset=self.columns, keep=False)
        if duplicated_mask.any():
            duplicated_rows = X[duplicated_mask].copy()
            duplicated_rows['Row_Index'] = duplicated_rows.index
            duplicated_rows['Check'] = 'DuplicateIdentifier'
            duplicated_rows['Key_Columns'] = str(self.columns)
            self.errors = duplicated_rows
        
        return X


class YearFilter(BaseEstimator, TransformerMixin):
    """Filter rows based on year range in date columns."""
    def __init__(self, date_column=None, start_year=None, end_year=None):
        self.date_column = date_column
        self.start_year = start_year
        self.end_year = end_year
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if not self.date_column or self.date_column not in X.columns:
            return X
        
        if not pd.api.types.is_datetime64_any_dtype(X[self.date_column]):
            return X
        
        issues = []
        years = X[self.date_column].dt.year
        
        if self.start_year is not None:
            before_start = (years < self.start_year).sum()
            if before_start > 0:
                issues.append({
                    'Column': self.date_column,
                    'Years_Before_Start': before_start,
                    'Start_Year': self.start_year,
                    'Check': 'YearFilter'
                })
        
        if self.end_year is not None:
            after_end = (years > self.end_year).sum()
            if after_end > 0:
                issues.append({
                    'Column': self.date_column,
                    'Years_After_End': after_end,
                    'End_Year': self.end_year,
                    'Check': 'YearFilter'
                })
        
        if issues:
            self.errors = pd.DataFrame(issues)
        return X


class StartEndYearComparator(BaseEstimator, TransformerMixin):
    """Compare start and end year columns for logical consistency."""
    def __init__(self, start_year_column=None, end_year_column=None):
        self.start_year_column = start_year_column
        self.end_year_column = end_year_column
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if not self.start_year_column or not self.end_year_column:
            return X
        
        if (self.start_year_column not in X.columns or 
            self.end_year_column not in X.columns):
            return X
        
        # Check if start year is after end year
        invalid_mask = X[self.start_year_column] > X[self.end_year_column]
        if invalid_mask.any():
            invalid_rows = X[invalid_mask].copy()
            invalid_rows['Row_Index'] = invalid_rows.index
            invalid_rows['Check'] = 'StartEndYearComparator'
            self.errors = invalid_rows
        
        return X


class ConstantValueDetector(BaseEstimator, TransformerMixin):
    """Detect columns dominated by a single value."""
    def __init__(self, threshold=0.95):
        self.threshold = threshold
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        issues = []
        for col in X.columns:
            if pd.api.types.is_numeric_dtype(X[col]):
                value_counts = X[col].value_counts()
                if len(value_counts) > 0:
                    most_common_freq = value_counts.iloc[0] / len(X[col])
                    if most_common_freq >= self.threshold:
                        issues.append({
                            'Column': col,
                            'Most_Common_Value': value_counts.index[0],
                            'Frequency': most_common_freq,
                            'Check': 'ConstantValueDetector'
                        })
        
        if issues:
            self.errors = pd.DataFrame(issues)
        return X


class OutlierDetector(BaseEstimator, TransformerMixin):
    """Detect statistical outliers using IQR or Z-score method."""
    def __init__(self, columns=None, method='iqr', threshold=1.5):
        self.columns = columns if columns else []
        self.method = method
        self.threshold = threshold
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        issues = []
        for col in self.columns:
            if col in X.columns and pd.api.types.is_numeric_dtype(X[col]):
                data = X[col].dropna()
                if len(data) == 0:
                    continue
                
                outliers = 0
                if self.method == 'iqr':
                    Q1 = data.quantile(0.25)
                    Q3 = data.quantile(0.75)
                    IQR = Q3 - Q1
                    lower_bound = Q1 - self.threshold * IQR
                    upper_bound = Q3 + self.threshold * IQR
                    outliers = ((data < lower_bound) | (data > upper_bound)).sum()
                
                elif self.method == 'zscore':
                    z_scores = np.abs((data - data.mean()) / data.std())
                    outliers = (z_scores > self.threshold).sum()
                
                if outliers > 0:
                    issues.append({
                        'Column': col,
                        'Outliers_Detected': outliers,
                        'Method': self.method,
                        'Check': 'OutlierDetector'
                    })
        
        if issues:
            self.errors = pd.DataFrame(issues)
        return X


class CrossFieldLogicChecker(BaseEstimator, TransformerMixin):
    """Validate cross-column logic rules."""
    def __init__(self, rules=None):
        self.rules = rules if rules else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        issues = []
        for rule in self.rules:
            try:
                # Evaluate rule as pandas expression
                invalid_mask = ~X.eval(rule)
                if invalid_mask.any():
                    invalid_rows = X[invalid_mask].copy()
                    invalid_rows['Row_Index'] = invalid_rows.index
                    invalid_rows['Rule'] = rule
                    invalid_rows['Check'] = 'CrossFieldLogicChecker'
                    issues.append(invalid_rows)
            except Exception as e:
                print(f"Error evaluating rule '{rule}': {e}")
        
        if issues:
            self.errors = pd.concat(issues, ignore_index=True)
        return X


class CategoryValidator(BaseEstimator, TransformerMixin):
    """Validate categorical values against expected values."""
    def __init__(self, column_expected_values=None):
        self.column_expected_values = column_expected_values if column_expected_values else {}
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        issues = []
        for col, expected_values in self.column_expected_values.items():
            if col in X.columns:
                invalid_mask = ~X[col].isin(expected_values)
                if invalid_mask.any():
                    invalid_rows = X[invalid_mask].copy()
                    invalid_rows['Row_Index'] = invalid_rows.index
                    invalid_rows['Column'] = col
                    invalid_rows['Expected_Values'] = str(expected_values)
                    invalid_rows['Check'] = 'CategoryValidator'
                    issues.append(invalid_rows)
        
        if issues:
            self.errors = pd.concat(issues, ignore_index=True)
        return X


class UniqueIDGenerator(BaseEstimator, TransformerMixin):
    """Generate unique ID column by concatenating specified columns."""
    def __init__(self, id_column=None, columns_to_concat=None):
        self.id_column = id_column
        self.columns_to_concat = columns_to_concat if columns_to_concat else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if not self.id_column or not self.columns_to_concat:
            return X
        
        # Create unique ID by concatenating specified columns
        X[self.id_column] = X[self.columns_to_concat].astype(str).agg('_'.join, axis=1)
        
        # Check for duplicates in generated ID
        duplicates = X[self.id_column].duplicated().sum()
        if duplicates > 0:
            self.errors = pd.DataFrame({
                'Generated_ID_Column': self.id_column,
                'Duplicate_IDs': duplicates,
                'Check': 'UniqueIDGenerator'
            })
        
        return X


class ColumnFilter(BaseEstimator, TransformerMixin):
    """Keep only selected columns."""
    def __init__(self, columns_to_keep=None):
        self.columns_to_keep = columns_to_keep if columns_to_keep else []
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if not self.columns_to_keep:
            return X
        
        # Keep only specified columns
        available_columns = [col for col in self.columns_to_keep if col in X.columns]
        X = X[available_columns]
        
        # Log removed columns
        removed_columns = [col for col in self.columns_to_keep if col not in X.columns]
        if removed_columns:
            self.errors = pd.DataFrame({
                'Removed_Columns': removed_columns,
                'Check': 'ColumnFilter'
            })
        
        return X


class IssueSaver(BaseEstimator, TransformerMixin):
    """Compile all detected issues into Excel and JSON reports."""
    def __init__(self, output_excel="data_issues.xlsx", output_json="data_issues.json"):
        self.output_excel = output_excel
        self.output_json = output_json
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        # This will be called after all other transformers
        # The actual issue compilation will be done in the pipeline
        return X

    def save_issues(self, all_errors, summary_data=None):
        """Save all issues to Excel and JSON files."""
        try:
            # Create Excel file with multiple sheets
            with pd.ExcelWriter(self.output_excel, engine='openpyxl') as writer:
                # Summary sheet
                if summary_data:
                    summary_df = pd.DataFrame([summary_data])
                    summary_df.to_excel(writer, sheet_name='Summary', index=False)
                
                # Individual check sheets
                for check_name, errors_df in all_errors.items():
                    if not errors_df.empty:
                        errors_df.to_excel(writer, sheet_name=check_name, index=False)
            
            # Create JSON summary
            json_data = {
                'timestamp': datetime.now().isoformat(),
                'total_issues': sum(len(df) for df in all_errors.values()),
                'checks': {name: len(df) for name, df in all_errors.items()},
                'summary': summary_data or {}
            }
            
            import json
            with open(self.output_json, 'w') as f:
                json.dump(json_data, f, indent=2)
            
            print(f"Issues saved to {self.output_excel} and {self.output_json}")
            
        except Exception as e:
            print(f"Error saving issues: {e}")


class FinalSaver(BaseEstimator, TransformerMixin):
    """Save cleaned data (for future phase)."""
    def __init__(self, output_file="cleaned_data.csv"):
        self.output_file = output_file
        self.errors = pd.DataFrame()

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        # This will be implemented in the cleaning phase
        return X