from sklearn.pipeline import Pipeline
from .custom_transformers import (
    MandatoryColumnsChecker, ColumnNameCleaner, WhitespaceCaseCleaner,
    MissingValuesDetector, IDValidator, NumericConverter,
    NegativeZeroChecker, DuplicateIdentifier, DuplicatesFromtheData,
    DateConverter, RemoveUnwantedCharacters, YearFilter,
    StartEndYearComparator, ConstantValueDetector, OutlierDetector,
    CrossFieldLogicChecker, CategoryValidator, IssueSaver
)

def create_issue_pipeline(configs):
    steps = [
        ("mandatory_columns", MandatoryColumnsChecker(
            mandatory_columns=configs.get("mandatory_columns", {}).get("mandatory_columns", [])
        )),
        ("column_name_cleaner", ColumnNameCleaner()),
        ("whitespace_case_cleaner", WhitespaceCaseCleaner(
            **configs.get("whitespace_case_cleaner", {})
        )),
        ("missing_values_detector", MissingValuesDetector()),
        ("id_validator", IDValidator(**configs.get("id_validator", {}))),
        ("numeric_converter", NumericConverter(**configs.get("numeric_converter", {}))),
        ("negative_zero_checker", NegativeZeroChecker(**configs.get("negative_zero_checker", {}))),
        ("duplicate_identifier", DuplicateIdentifier(**configs.get("duplicate_identifier", {}))),
        ("duplicates_from_the_data", DuplicatesFromtheData()),
        ("remove_unwanted_characters", RemoveUnwantedCharacters(
            **configs.get("remove_unwanted_characters", {})
        )),
        ("date_converter", DateConverter(**configs.get("date_converter", {}))),
        ("year_filter", YearFilter(**configs.get("year_filter", {}))),
        ("start_end_comparator", StartEndYearComparator(**configs.get("start_end_comparator", {}))),
        ("constant_value_detector", ConstantValueDetector(**configs.get("constant_value_detector", {}))),
        ("outlier_detector", OutlierDetector(**configs.get("outlier_detector", {}))),
        ("category_validator", CategoryValidator(**configs.get("category_validator", {}))),
        ("cross_field_logic_checker", CrossFieldLogicChecker(**configs.get("cross_field_logic_checker", {}))),
        ("issue_saver", IssueSaver(filename="data_issues.xlsx"))
    ]

    pipeline = Pipeline(steps)

    # Attach steps to IssueSaver for error logging
    for name, transformer in steps:
        if isinstance(transformer, IssueSaver):
            transformer.pipeline_steps = steps

    return pipeline
