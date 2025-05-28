from sklearn.pipeline import Pipeline
from custom_transformers import (
    ImportDataTransformer, MandatoryColumnsChecker, ColumnNameCleaner,
    WhitespaceCaseCleaner, MissingValuesDetector, IDValidator, NumericConverter,
    NegativeZeroChecker, DuplicateIdentifier, DuplicatesFromtheData, DateConverter,
    RemoveUnwantedCharacters, YearFilter, StartEndYearComparator, UniqueIDGenerator,
    ColumnFilter, FinalSaver, IssueSaver
)

def create_pipeline(configs):
    steps = [
        ("mandatory_columns", MandatoryColumnsChecker(mandatory_columns=configs.get("mandatory_columns", {}).get("mandatory_columns", []))),
        ("column_name_cleaner", ColumnNameCleaner(**configs.get("column_name_cleaner", {}))),
        ("whitespace_case_cleaner", WhitespaceCaseCleaner(**configs.get("whitespace_case_cleaner", {}))),
        ("missing_values_detector", MissingValuesDetector(**configs.get("missing_values_detector", {}))),
        ("id_validator", IDValidator(**configs.get("id_validator", {}))),
        ("numeric_converter", NumericConverter(**configs.get("numeric_converter", {}))),
        ("negative_zero_checker", NegativeZeroChecker(**configs.get("negative_zero_checker", {}))),
        ("duplicate_identifier", DuplicateIdentifier(**configs.get("duplicate_identifier", {}))),
        ("duplicates_from_the_data", DuplicatesFromtheData(**configs.get("duplicates_from_the_data", {}))),
        ("remove_unwanted_characteristics", RemoveUnwantedCharacters(**configs.get("remove_uwanted_characteristics", {}))),  # Fixed missing comma
        ("date_converter", DateConverter(**configs.get("date_converter", {}))),
        ("year_filter", YearFilter(**configs.get("year_filter", {}))),
        ("start_end_comparator", StartEndYearComparator(**configs.get("start_end_comparator", {}))),
        ("unique_id_generator", UniqueIDGenerator(**configs.get("unique_id_generator", {}))),
        ("column_filter", ColumnFilter(**configs.get("column_filter", {}))),
        ("final_saver", FinalSaver(cleaned_filename="cleaned_data.xlsx")),
        ("issue_saver", IssueSaver(filename="data_issues.xlsx"))
    ]

    pipeline = Pipeline(steps)

    for name, transformer in steps:
        if isinstance(transformer, IssueSaver):
            transformer.pipeline_steps = steps

    return pipeline
