from sklearn.pipeline import Pipeline
from .custom_transformers import (
    ImportDataTransformer,
    ColumnNameCleaner,
    MandatoryColumnsChecker,
    WhitespaceCaseCleaner,
    RemoveUnwantedCharacters,
    NumericConverter,
    DateConverter,
    MissingValuesDetector,
    IDValidator,
    NegativeZeroChecker,
    DuplicatesFromtheData,
    DuplicateIdentifier,
    YearFilter,
    StartEndYearComparator,
    ConstantValueDetector,
    OutlierDetector,
    CrossFieldLogicChecker,
    CategoryValidator,
    UniqueIDGenerator,
    ColumnFilter,
    IssueSaver
)


def create_issue_pipeline(configs=None):
    """
    Create a comprehensive data quality checking pipeline.
    
    Args:
        configs: Dictionary containing configuration for various checks
        
    Returns:
        sklearn Pipeline object
    """
    if configs is None:
        configs = {}
    
    # Extract configuration values with defaults
    mandatory_columns = configs.get('mandatory_columns', [])
    text_columns = configs.get('text_columns', [])
    numeric_columns = configs.get('numeric_columns', [])
    date_columns = configs.get('date_columns', [])
    id_column = configs.get('id_column', '')
    duplicate_key_columns = configs.get('duplicate_key_columns', [])
    year_filter_config = configs.get('year_filter', {})
    start_end_year_config = configs.get('start_end_year', {})
    outlier_config = configs.get('outlier_detection', {})
    cross_field_rules = configs.get('cross_field_rules', [])
    category_validation = configs.get('category_validation', {})
    unique_id_config = configs.get('unique_id_generation', {})
    columns_to_keep = configs.get('columns_to_keep', [])
    unwanted_chars = configs.get('unwanted_characters', ['\n', '\r', '\t'])
    case_standardization = configs.get('case_standardization', 'upper')
    
    # Build the pipeline
    pipeline_steps = [
        # 1. Import Data (handled separately in upload endpoint)
        # 2. Column hygiene
        ('column_name_cleaner', ColumnNameCleaner()),
        
        # 3. Structure check
        ('mandatory_columns_checker', MandatoryColumnsChecker(
            mandatory_columns=mandatory_columns
        )),
        
        # 4. Cell hygiene
        ('whitespace_case_cleaner', WhitespaceCaseCleaner(
            columns=text_columns,
            case=case_standardization
        )),
        ('remove_unwanted_chars', RemoveUnwantedCharacters(
            columns=text_columns,
            unwanted_chars=unwanted_chars
        )),
        
        # 5. Type coercions
        ('numeric_converter', NumericConverter(
            columns=numeric_columns
        )),
        ('date_converter', DateConverter(
            columns=date_columns
        )),
        
        # 6. Row integrity
        ('missing_values_detector', MissingValuesDetector(
            columns=text_columns + numeric_columns + date_columns
        )),
        ('duplicates_from_data', DuplicatesFromtheData()),
        ('duplicate_identifier', DuplicateIdentifier(
            columns=duplicate_key_columns
        )),
        ('id_validator', IDValidator(
            id_column=id_column
        )),
        
        # 7. Range & logic
        ('negative_zero_checker', NegativeZeroChecker(
            columns=numeric_columns
        )),
        ('year_filter', YearFilter(
            date_column=year_filter_config.get('date_column', ''),
            start_year=year_filter_config.get('start_year'),
            end_year=year_filter_config.get('end_year')
        )),
        ('start_end_year_comparator', StartEndYearComparator(
            start_year_column=start_end_year_config.get('start_year_column', ''),
            end_year_column=start_end_year_config.get('end_year_column', '')
        )),
        ('constant_value_detector', ConstantValueDetector(
            threshold=configs.get('constant_value_threshold', 0.95)
        )),
        ('outlier_detector', OutlierDetector(
            columns=outlier_config.get('columns', numeric_columns),
            method=outlier_config.get('method', 'iqr'),
            threshold=outlier_config.get('threshold', 1.5)
        )),
        ('cross_field_logic_checker', CrossFieldLogicChecker(
            rules=cross_field_rules
        )),
        ('category_validator', CategoryValidator(
            column_expected_values=category_validation
        )),
        
        # 8. Data transformation
        ('unique_id_generator', UniqueIDGenerator(
            id_column=unique_id_config.get('id_column', ''),
            columns_to_concat=unique_id_config.get('columns_to_concat', [])
        )),
        ('column_filter', ColumnFilter(
            columns_to_keep=columns_to_keep
        )),
        
        # 9. Bookkeeping
        ('issue_saver', IssueSaver())
    ]
    
    return Pipeline(pipeline_steps)


def get_default_config():
    """
    Get default configuration for the data quality pipeline.
    
    Returns:
        Dictionary with default configuration values
    """
    return {
        'mandatory_columns': [],
        'text_columns': [],
        'numeric_columns': [],
        'date_columns': [],
        'id_column': '',
        'duplicate_key_columns': [],
        'year_filter': {
            'date_column': '',
            'start_year': None,
            'end_year': None
        },
        'start_end_year': {
            'start_year_column': '',
            'end_year_column': ''
        },
        'outlier_detection': {
            'columns': [],
            'method': 'iqr',
            'threshold': 1.5
        },
        'cross_field_rules': [],
        'category_validation': {},
        'unique_id_generation': {
            'id_column': '',
            'columns_to_concat': []
        },
        'columns_to_keep': [],
        'unwanted_characters': ['\n', '\r', '\t'],
        'case_standardization': 'upper',
        'constant_value_threshold': 0.95
    }


def get_available_checks():
    """
    Get list of available data quality checks.
    
    Returns:
        List of dictionaries describing available checks
    """
    return [
        {
            'name': 'MandatoryColumnsChecker',
            'description': 'Detects missing required columns',
            'config_fields': ['mandatory_columns']
        },
        {
            'name': 'WhitespaceCaseCleaner',
            'description': 'Trims whitespace and unifies case',
            'config_fields': ['text_columns', 'case_standardization']
        },
        {
            'name': 'RemoveUnwantedCharacters',
            'description': 'Removes forbidden characters and logs them',
            'config_fields': ['text_columns', 'unwanted_characters']
        },
        {
            'name': 'MissingValuesDetector',
            'description': 'Flags rows with missing values',
            'config_fields': ['text_columns', 'numeric_columns', 'date_columns']
        },
        {
            'name': 'IDValidator',
            'description': 'Checks for missing IDs',
            'config_fields': ['id_column']
        },
        {
            'name': 'NumericConverter',
            'description': 'Coerces specified columns to numeric and logs failures',
            'config_fields': ['numeric_columns']
        },
        {
            'name': 'NegativeZeroChecker',
            'description': 'Finds negative or zero values in numeric fields',
            'config_fields': ['numeric_columns']
        },
        {
            'name': 'DuplicatesFromtheData',
            'description': 'Flags fully duplicated rows',
            'config_fields': []
        },
        {
            'name': 'DuplicateIdentifier',
            'description': 'Flags duplicate rows by key columns',
            'config_fields': ['duplicate_key_columns']
        },
        {
            'name': 'DateConverter',
            'description': 'Coerces columns to datetime and logs errors',
            'config_fields': ['date_columns']
        },
        {
            'name': 'StartEndYearComparator',
            'description': 'Checks logical order of start/end year columns',
            'config_fields': ['start_end_year']
        },
        {
            'name': 'YearFilter',
            'description': 'Flags years outside a valid range',
            'config_fields': ['year_filter']
        },
        {
            'name': 'ConstantValueDetector',
            'description': 'Detects columns dominated by a single value',
            'config_fields': ['constant_value_threshold']
        },
        {
            'name': 'OutlierDetector',
            'description': 'Finds statistical outliers (IQR or Z-score)',
            'config_fields': ['outlier_detection']
        },
        {
            'name': 'CrossFieldLogicChecker',
            'description': 'Validates cross-column logic rules',
            'config_fields': ['cross_field_rules']
        },
        {
            'name': 'CategoryValidator',
            'description': 'Ensures categorical values are valid',
            'config_fields': ['category_validation']
        },
        {
            'name': 'UniqueIDGenerator',
            'description': 'Creates a unique ID column',
            'config_fields': ['unique_id_generation']
        },
        {
            'name': 'ColumnFilter',
            'description': 'Keeps only selected columns',
            'config_fields': ['columns_to_keep']
        }
    ]